import React from "react";
import EmployeeRow from "./EmployeeRow";

export default function TaskTable({
  employees,
  selectMode,
  selectedEmployees,
  setSelectedEmployees,
  selectedTasksForDeletion,
  toggleTaskDeletion,
  deleteSingleTask, // ✅ ADD THIS (from Dashboard)
}) {
  // Get all unique dates from tasks and sort them
  const dates = [
    ...new Set(employees.flatMap(e => e.tasks.map(t => t.date))),
  ].sort((a, b) => new Date(a) - new Date(b));

  const formatDate = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.getDate() + " " + dt.toLocaleString("default", { month: "short" });
  };

  // Check if a date is fully selected for deletion
  const isDateSelected = (date) =>
    employees.every(emp =>
      !emp.tasks.some(t => t.date === date) ||
      selectedTasksForDeletion.includes(`${emp.name}_${date}`)
    );

  // Toggle all tasks for a date across all employees
  const toggleDate = (date) => {
    employees.forEach(emp => {
      if (emp.tasks.some(t => t.date === date)) {
        toggleTaskDeletion(emp.name, date);
      }
    });
  };

  return (
    <div className="task-table-wrapper">
      <table className="task-table">
        <thead>
          <tr>
            {selectMode && <th />}
            <th>Employee</th>

            {dates.map(d => {
              const hasTasks = employees.some(e =>
                e.tasks.some(t => t.date === d)
              );

              return (
                <th key={d} style={{ textAlign: "center" }}>
                  {formatDate(d)}

                  {selectMode && hasTasks && (
                    <div>
                      <input
                        type="checkbox"
                        checked={isDateSelected(d)}
                        onChange={() => toggleDate(d)}
                        style={{ marginTop: "4px" }}
                      />
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {employees.map(emp => (
            <EmployeeRow
              key={emp.name}
              employee={emp}
              dates={dates}
              selectMode={selectMode}
              selectedEmployees={selectedEmployees}
              setSelectedEmployees={setSelectedEmployees}
              selectedTasksForDeletion={selectedTasksForDeletion}
              toggleTaskDeletion={toggleTaskDeletion}
              deleteSingleTask={deleteSingleTask} // ✅ PASS DOWN
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
