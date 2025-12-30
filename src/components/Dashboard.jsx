import React, { useState, useEffect } from "react";
import AddTaskForm from "./AddTaskForm";
import TaskTable from "./TaskTable";
import { FaPlus, FaTable, FaTrash, FaCopy } from "react-icons/fa";
import { db } from "./firebase/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import "./Dashboard.css";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedTasksForDeletion, setSelectedTasksForDeletion] = useState([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySelectedEmployee, setCopySelectedEmployee] = useState("");
  const [copySourceDate, setCopySourceDate] = useState("");
  const [copySelectedTasks, setCopySelectedTasks] = useState([]);
  const [copyTargetDates, setCopyTargetDates] = useState([]);

  // Fetch tasks from Firestore
  useEffect(() => {
    const fetchTasks = async () => {
      const snapshot = await getDocs(collection(db, "employees"));
      const temp = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const name = data.Name;
        const task = {
          name: data.Task,
          date: data.Date.toDate().toISOString().split("T")[0],
          order: data.Order || 1,
          docId: docSnap.id
        };
        if (!temp[name]) temp[name] = [];
        temp[name].push(task);
      });

      const loaded = Object.keys(temp).map(name => ({
        name,
        tasks: temp[name].sort((a, b) => a.order - b.order)
      }));

      setEmployees(loaded);
    };

    fetchTasks();
  }, []);

  const addTask = (name, task) => {
    if (!name || !task.name || !task.date) return;

    setEmployees(prev => {
      const emp = prev.find(e => e.name === name);
      if (emp) {
        return prev.map(e =>
          e.name === name
            ? { ...e, tasks: [...e.tasks, task].sort((a, b) => a.order - b.order) }
            : e
        );
      }
      return [...prev, { name, tasks: [task] }];
    });
  };

  const toggleTaskDeletion = (empName, date) => {
    const key = `${empName}_${date}`;
    setSelectedTasksForDeletion(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // ===================== FIXED DELETE FUNCTION =====================
  const deleteSelectedEmployees = async () => {
    try {
      // --- Delete all selected employees and their tasks ---
      for (const empName of selectedEmployees) {
        const emp = employees.find(e => e.name === empName);
        if (emp) {
          for (const t of emp.tasks) {
            await deleteDoc(doc(db, "employees", t.docId));
          }
        }
      }

      // --- Delete per-date selected tasks ---
      for (const key of selectedTasksForDeletion) {
        const [empName, date] = key.split("_");
        // Skip employees already deleted above
        if (selectedEmployees.includes(empName)) continue;

        const emp = employees.find(e => e.name === empName);
        if (emp) {
          const tasksToDelete = emp.tasks.filter(t => t.date === date);
          for (const t of tasksToDelete) {
            await deleteDoc(doc(db, "employees", t.docId));
          }
        }
      }

      // --- Update local state after deletions ---
      setEmployees(prev =>
        prev
          .filter(emp => !selectedEmployees.includes(emp.name))
          .map(emp => ({
            ...emp,
            tasks: emp.tasks.filter(
              t => !selectedTasksForDeletion.includes(`${emp.name}_${t.date}`)
            )
          }))
      );

      setSelectedEmployees([]);
      setSelectedTasksForDeletion([]);
      setSelectMode(false);
    } catch (err) {
      console.error("Error deleting tasks/employees:", err);
    }
  };

  // --- Single task delete function (per X click) ---
  const deleteSingleTask = async (task) => {
    try {
      await deleteDoc(doc(db, "employees", task.docId));
      setEmployees(prev =>
        prev.map(emp => ({
          ...emp,
          tasks: emp.tasks.filter(t => t.docId !== task.docId)
        }))
      );
    } catch (err) {
      console.error("Error deleting single task:", err);
    }
  };
  // ===============================================================

  const toggleTaskSelection = (index) => {
    setCopySelectedTasks(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredSourceTasks = () => {
    if (!copySelectedEmployee || !copySourceDate) return [];
    const emp = employees.find(e => e.name === copySelectedEmployee);
    return emp?.tasks.filter(t => t.date === copySourceDate) || [];
  };

  const copyTasks = async () => {
    if (!copySelectedEmployee || copySelectedTasks.length === 0 || copyTargetDates.length === 0) return;

    const emp = employees.find(e => e.name === copySelectedEmployee);
    if (!emp) return;

    const sourceTasks = emp.tasks.filter(t => t.date === copySourceDate);
    const newTasks = [...emp.tasks];

    for (const index of copySelectedTasks) {
      const taskToCopy = sourceTasks[index];
      for (const dateStr of copyTargetDates) {
        const newOrder = newTasks.filter(t => t.date === dateStr).length + 1;
        const newTask = { ...taskToCopy, date: dateStr, order: newOrder };

        try {
          await addDoc(collection(db, "employees"), {
            Name: emp.name,
            Task: newTask.name,
            Date: Timestamp.fromDate(new Date(dateStr)),
            Order: newTask.order
          });
        } catch (err) {
          console.error("Error duplicating task:", err);
        }

        newTasks.push(newTask);
      }
    }

    setEmployees(prev =>
      prev.map(e =>
        e.name === emp.name
          ? { ...e, tasks: newTasks.sort((a, b) => a.order - b.order) }
          : e
      )
    );

    setCopySelectedEmployee("");
    setCopySourceDate("");
    setCopySelectedTasks([]);
    setCopyTargetDates([]);
    setShowCopyModal(false);
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h2 className="dash-title">Team Task Dashboard</h2>
          <p className="dash-subtitle">Daily task tracking & workload overview</p>
        </div>
        <div className="dash-icons">
          <FaPlus title="Add Task" onClick={() => setShowForm(true)} />
          <FaTable title="Table View" onClick={() => setShowForm(false)} />
          <FaTrash title="Delete Mode" onClick={() => setSelectMode(!selectMode)} />
          <FaCopy title="Copy Tasks" onClick={() => setShowCopyModal(true)} />
        </div>
      </header>

      {showForm && <AddTaskForm onAdd={addTask} employeeTasks={employees.flatMap(e => e.tasks)} />}

      {selectMode && (
        <button className="danger-btn" onClick={deleteSelectedEmployees}>
          Delete Selected
        </button>
      )}

      <TaskTable
        employees={employees}
        selectMode={selectMode}
        selectedEmployees={selectedEmployees}
        setSelectedEmployees={setSelectedEmployees}
        selectedTasksForDeletion={selectedTasksForDeletion}
        toggleTaskDeletion={toggleTaskDeletion}
        deleteSingleTask={deleteSingleTask} // single-task delete enabled
      />

      {showCopyModal && (
        <div className="modal-backdrop">
          <div className="modal-card copy-modal">
            <h3>Copy Tasks</h3>
            <label>
              Select Employee:
              <select
                value={copySelectedEmployee}
                onChange={e => { setCopySelectedEmployee(e.target.value); setCopySourceDate(""); setCopySelectedTasks([]); }}
              >
                <option value="">--Select Employee--</option>
                {employees.map(emp => (
                  <option key={emp.name} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </label>

            {copySelectedEmployee && (
              <label>
                Select Source Date:
                <input
                  type="date"
                  value={copySourceDate}
                  onChange={e => { setCopySourceDate(e.target.value); setCopySelectedTasks([]); }}
                />
              </label>
            )}

            {filteredSourceTasks().length > 0 && (
              <div className="task-selection">
                {filteredSourceTasks().map((task, i) => (
                  <label key={i} className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={copySelectedTasks.includes(i)}
                      onChange={() => toggleTaskSelection(i)}
                    />
                    <span className="task-name">{task.name}</span>
                  </label>
                ))}
              </div>
            )}

            {copySelectedTasks.length > 0 && (
              <label>
                Target Dates (comma separated):
                <input
                  type="text"
                  placeholder="e.g., 2025-12-01,2025-12-05"
                  value={copyTargetDates.join(",")}
                  onChange={e =>
                    setCopyTargetDates(e.target.value.split(",").map(d => d.trim()))
                  }
                />
              </label>
            )}

            <div className="modal-buttons">
              <button onClick={copyTasks}>Copy Selected Tasks</button>
              <button className="cancel-btn" onClick={() => setShowCopyModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
