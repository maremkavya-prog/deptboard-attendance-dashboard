import { useMemo, useReducer, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'
import { initialStudents } from './data'

const SUBJECTS = ['Maths', 'Java', 'DBMS']

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_MARK':
      return state.map(student =>
        student.id === action.id
          ? { ...student, [action.subject]: Number(action.value) }
          : student
      )
    default:
      return state
  }
}

function average(student) {
  return Math.round((student.Maths + student.Java + student.DBMS) / 3)
}

function App() {
  const [students, dispatch] = useReducer(reducer, initialStudents)
  const [page, setPage] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return students
      .filter(s => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q))
      .sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        if (typeof av === 'string') return av.localeCompare(bv)
        return bv - av
      })
  }, [students, query, sortKey])

  const total = students.length
  const avgAttendance = Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / total)
  const lowAttendance = students.filter(s => s.attendance < 75).length
  const avgMarks = Math.round(students.reduce((sum, s) => sum + average(s), 0) / total)

  const subjectData = SUBJECTS.map(subject => ({
    subject,
    marks: Math.round(students.reduce((sum, s) => sum + s[subject], 0) / total)
  }))

  const attendanceData = [
    { name: '75%+', value: students.filter(s => s.attendance >= 75).length },
    { name: 'Below 75%', value: lowAttendance }
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">D</div>
          <div><strong>DeptBoard</strong><span>CS Department</span></div>
        </div>

        <nav>
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>⌂ <span>Dashboard</span></button>
          <button className={page === 'students' ? 'active' : ''} onClick={() => setPage('students')}>☷ <span>Students</span></button>
        </nav>

        <div className="sidebar-note">
          <b>HOD Dashboard</b>
          <span>Attendance & Results</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{page === 'dashboard' ? 'Attendance & Results' : 'Students'}</h1>
            <p>Monitor student performance at a glance</p>
          </div>
          <div className="user">
            <div className="avatar">H</div>
            <div><b>Department HOD</b><small>Administrator</small></div>
          </div>
        </header>

        {page === 'dashboard' ? (
          <>
            <section className="stats">
              <Stat title="Total Students" value={total} icon="👥" />
              <Stat title="Average Attendance" value={`${avgAttendance}%`} icon="📅" />
              <Stat title="Low Attendance" value={lowAttendance} icon="⚠️" danger />
              <Stat title="Average Marks" value={`${avgMarks}%`} icon="📊" />
            </section>

            <section className="charts">
              <div className="card">
                <div className="card-head"><div><h2>Subject Performance</h2><p>Average marks by subject</p></div></div>
                <div className="chart"><ResponsiveContainer width="100%" height={270}>
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="marks" fill="#2563eb" radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer></div>
              </div>

              <div className="card">
                <div className="card-head"><div><h2>Attendance Status</h2><p>75% attendance requirement</p></div></div>
                <div className="pie-wrap"><ResponsiveContainer width="100%" height={270}>
                  <PieChart>
                    <Pie data={attendanceData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} label>
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer></div>
              </div>
            </section>

            <StudentTable
              students={filtered.slice(0, 6)}
              query={query}
              setQuery={setQuery}
              sortKey={sortKey}
              setSortKey={setSortKey}
              onSelect={setSelected}
            />
          </>
        ) : (
          <StudentTable
            students={filtered}
            query={query}
            setQuery={setQuery}
            sortKey={sortKey}
            setSortKey={setSortKey}
            onSelect={setSelected}
          />
        )}

        {selected && (
          <StudentModal
            student={students.find(s => s.id === selected)}
            onClose={() => setSelected(null)}
            dispatch={dispatch}
          />
        )}
      </main>
    </div>
  )
}

function Stat({ title, value, icon, danger }) {
  return <div className="stat card">
    <div className={`stat-icon ${danger ? 'danger' : ''}`}>{icon}</div>
    <div><p>{title}</p><strong>{value}</strong></div>
  </div>
}

function StudentTable({ students, query, setQuery, sortKey, setSortKey, onSelect }) {
  return <section className="card table-card">
    <div className="table-head">
      <div><h2>Student Records</h2><p>Search, sort and view student details</p></div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search student or roll no..." />
    </div>
    <div className="controls">
      <label>Sort by:
        <select value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="name">Name</option>
          <option value="attendance">Attendance</option>
          <option value="Maths">Maths</option>
          <option value="Java">Java</option>
          <option value="DBMS">DBMS</option>
        </select>
      </label>
    </div>
    <div className="table-scroll">
      <table>
        <thead><tr><th>Student</th><th>Roll No.</th><th>Attendance</th><th>Maths</th><th>Java</th><th>DBMS</th><th>Average</th><th>Status</th></tr></thead>
        <tbody>
          {students.map(s => <tr key={s.id} className={s.attendance < 75 ? 'low-row' : ''} onClick={() => onSelect(s.id)}>
            <td><b>{s.name}</b></td><td>{s.roll}</td>
            <td><span className={`attendance ${s.attendance < 75 ? 'bad' : ''}`}>{s.attendance}%</span></td>
            <td>{s.Maths}</td><td>{s.Java}</td><td>{s.DBMS}</td><td><b>{average(s)}%</b></td>
            <td><span className={`badge ${s.attendance < 75 ? 'warning' : 'good'}`}>{s.attendance < 75 ? 'Low Attendance' : 'Good'}</span></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>
}

function StudentModal({ student, onClose, dispatch }) {
  return <div className="overlay" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head">
        <div><div className="big-avatar">{student.name.charAt(0)}</div></div>
        <div><h2>{student.name}</h2><p>{student.roll} · Attendance {student.attendance}%</p></div>
        <button className="close" onClick={onClose}>×</button>
      </div>
      <div className="marks-grid">
        {SUBJECTS.map(subject => <label key={subject}>{subject}
          <input type="number" min="0" max="100" value={student[subject]}
            onChange={e => dispatch({ type: 'UPDATE_MARK', id: student.id, subject, value: e.target.value })} />
        </label>)}
      </div>
      <div className="modal-footer"><span>Average: <b>{average(student)}%</b></span><button onClick={onClose}>Done</button></div>
    </div>
  </div>
}

export default App
