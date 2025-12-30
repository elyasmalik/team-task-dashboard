import { FaTimes } from "react-icons/fa";

export default function EmployeeRow({
  employee,
  dates,
  selectMode,
  selectedEmployees,
  setSelectedEmployees,
  selectedTasksForDeletion,
  toggleTaskDeletion,
  deleteSingleTask, // ✅ REQUIRED for X delete
}) {
  const toggleEmployee = () => {
    setSelectedEmployees(s =>
      s.includes(employee.name)
        ? s.filter(n => n !== employee.name)
        : [...s, employee.name]
    );
  };

  return (
    <tr>
      {selectMode && (
        <td>
          <input
            type="checkbox"
            checked={selectedEmployees.includes(employee.name)}
            onChange={toggleEmployee}
          />
        </td>
      )}

      <td className="emp-name">{employee.name}</td>

      {dates.map(d => {
        const tasksForDate = employee.tasks.filter(t => t.date === d);

        return (
          <td key={d}>
            <div className="task-cell-center">
              {tasksForDate.map((t, idx) => (
                <div
                  key={idx}
                  className="task-chip"
                  style={{
                    display: "block",
                    marginBottom: "2px",
                    position: "relative",
                  }}
                >
                  {t.name}

                  {/* ❌ Individual task delete (iOS-style) */}
                  {selectMode && (
                    <FaTimes
                      style={{
                        position: "absolute",
                        top: "-6px",
                        left: "-6px",
                        fontSize: "11px",
                        cursor: "pointer",
                        color: "#c0392b",
                        background: "#fff",
                        borderRadius: "50%",
                      }}
                      onClick={() => deleteSingleTask(t)}
                      title="Delete task"
                    />
                  )}
                </div>
              ))}

              {/* checkbox under tasks intentionally removed */}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
