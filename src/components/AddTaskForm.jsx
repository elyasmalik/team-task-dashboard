import React, { useState } from "react";
import { db } from "./firebase/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function AddTaskForm({ onAdd, employeeTasks = [] }) {
  const [name, setName] = useState("");
  const [task, setTask] = useState("");
  const [date, setDate] = useState("");
  const [order, setOrder] = useState("");

  const submit = async () => {
    if (!name || !task || !date) return;

    const taskOrder =
      order !== ""
        ? parseInt(order, 10)
        : employeeTasks.filter(t => t.date === date).length + 1;

    const taskObj = { name: task, date, order: taskOrder };

    onAdd(name, taskObj);

    try {
      await addDoc(collection(db, "employees"), {
        Name: name,
        Task: task,
        Date: Timestamp.fromDate(new Date(date)),
        Order: taskOrder
      });
    } catch (err) {
      console.error("Error adding document: ", err);
    }

    setName("");
    setTask("");
    setDate("");
    setOrder("");
  };

  return (
    <div className="add-form">
      <input
        placeholder="Employee Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Task Name"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Order"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        min="1"
      />
      <button onClick={submit}>Add Task</button>
    </div>
  );
}
