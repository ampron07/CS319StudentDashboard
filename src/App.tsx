import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, Check, ChevronDown, Clock3, Edit3, Flame, LayoutDashboard, ListTodo, LogOut, Plus, Settings, Trash2, UserRound, X } from 'lucide-react'

type Status = 'Not started' | 'In progress' | 'Complete' | 'Overdue'
type Priority = 'High' | 'Medium' | 'Low'
type Course = { id: string; name: string; code: string; instructor: string; color: string }
type Assignment = { id: string; title: string; courseId: string; due: string; priority: Priority; status: Status; grade?: number }
type TermData = { courses: Course[]; assignments: Assignment[]; startDate?: string }

const seedCourses: Course[] = [
  { id: 'cs319', name: 'Web Application Development', code: 'CS 319', instructor: 'Dr. Maya Patel', color: '#e87a5d' },
  { id: 'math241', name: 'Discrete Mathematics', code: 'MATH 241', instructor: 'Prof. Eli Brooks', color: '#4e8d8a' },
  { id: 'hist202', name: 'Modern World History', code: 'HIST 202', instructor: 'Dr. Lena Morris', color: '#d7a441' },
]
const seedAssignments: Assignment[] = [
  { id: 'a1', title: 'Usability test report', courseId: 'cs319', due: '2026-09-07', priority: 'High', status: 'In progress' },
  { id: 'a2', title: 'Graph theory problem set', courseId: 'math241', due: '2026-09-09', priority: 'Medium', status: 'Not started' },
  { id: 'a3', title: 'Industrial revolution essay', courseId: 'hist202', due: '2026-09-12', priority: 'Low', status: 'Not started' },
  { id: 'a4', title: 'Prototype walkthrough', courseId: 'cs319', due: '2026-09-15', priority: 'Medium', status: 'Not started' },
]

const id = () => Math.random().toString(36).slice(2, 9)
const blankAssignment: Omit<Assignment, 'id'> = { title: '', courseId: 'cs319', due: '', priority: 'Medium', status: 'Not started' }

function App() {
  const [terms, setTerms] = useState<Record<string, TermData>>(() => {
    const savedTerms = JSON.parse(localStorage.getItem('study-terms') || 'null') as Record<string, TermData> | null
    if (savedTerms) return savedTerms
    return { 'Fall 2026': { courses: JSON.parse(localStorage.getItem('study-courses') || 'null') || seedCourses, assignments: JSON.parse(localStorage.getItem('study-assignments') || 'null') || seedAssignments, startDate: '2026-08-17' } }
  })
  const [currentTerm, setCurrentTerm] = useState(() => localStorage.getItem('study-current-term') || 'Fall 2026')
  const [activeView, setActiveView] = useState<'overview' | 'courses'>('overview')
  const [filter, setFilter] = useState<'All' | Status>('All')
  const [modal, setModal] = useState<{ type: 'course' | 'assignment'; data: Course | Assignment | null } | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => localStorage.getItem('study-current-date') || '2026-09-04')

  const activeTerm = terms[currentTerm] || { courses: [], assignments: [] }
  const courses = activeTerm.courses
  const assignments = activeTerm.assignments
  function setCourses(updater: Course[] | ((items: Course[]) => Course[])) {
    setTerms((items) => { const term = items[currentTerm] || { courses: [], assignments: [] }; const nextCourses = typeof updater === 'function' ? updater(term.courses) : updater; return { ...items, [currentTerm]: { ...term, courses: nextCourses } } })
  }
  function setAssignments(updater: Assignment[] | ((items: Assignment[]) => Assignment[])) {
    setTerms((items) => { const term = items[currentTerm] || { courses: [], assignments: [] }; const nextAssignments = typeof updater === 'function' ? updater(term.assignments) : updater; return { ...items, [currentTerm]: { ...term, assignments: nextAssignments } } })
  }
  useEffect(() => { localStorage.setItem('study-terms', JSON.stringify(terms)); localStorage.setItem('study-current-term', currentTerm) }, [terms, currentTerm])
  useEffect(() => { if (!terms[currentTerm]) setTerms((items) => ({ ...items, [currentTerm]: { courses: [], assignments: [] } })) }, [currentTerm, terms])
  useEffect(() => { localStorage.setItem('study-current-date', currentDate) }, [currentDate])
  useEffect(() => {
    setAssignments((items) => items.map((item) => item.status !== 'Complete' && item.due < currentDate ? { ...item, status: 'Overdue' } : item))
  }, [currentDate, currentTerm])

  function selectTerm(term: string) {
    setCurrentTerm(term)
    setActiveView('overview')
    setFilter('All')
  }
  function createTerm() {
    const name = window.prompt('Name this term', 'Spring 2027')?.trim()
    if (!name) return
    if (!terms[name]) setTerms((items) => ({ ...items, [name]: { courses: [], assignments: [], startDate: currentDate } }))
    selectTerm(name)
  }

  const completed = assignments.filter((item) => item.status === 'Complete').length
  const dueSoon = assignments.filter((item) => item.status !== 'Complete').length
  const progress = assignments.length ? Math.round((completed / assignments.length) * 100) : 0
  const gradedAssignments = assignments.filter((item) => item.status === 'Complete' && item.grade !== undefined)
  const averageGrade = gradedAssignments.length ? Math.round((gradedAssignments.reduce((total, item) => total + (item.grade || 0), 0) / gradedAssignments.length) * 10) / 10 : null
  const termStart = activeTerm.startDate || (currentTerm === 'Fall 2026' ? '2026-08-17' : currentDate)
  const daysSinceTermStart = Math.floor((Date.parse(currentDate) - Date.parse(termStart)) / 86400000)
  const termWeek = Math.min(15, Math.max(1, Math.floor(daysSinceTermStart / 7) + 1))
  const weekEnd = new Date(`${currentDate}T12:00:00`)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndString = weekEnd.toISOString().slice(0, 10)
  const totalThisWeek = assignments.filter((item) => item.due >= currentDate && item.due <= weekEndString).length
  const thisWeekAssignments = assignments.filter((item) => item.status !== 'Complete' && item.due >= currentDate && item.due <= weekEndString)
  const overdueAssignments = assignments.filter((item) => item.status === 'Overdue').sort((left, right) => left.due.localeCompare(right.due))
  const oldestOverdue = overdueAssignments[0]
  const shownAssignments = useMemo(() => filter === 'All' ? assignments : assignments.filter((item) => item.status === filter), [assignments, filter])

  function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const existing = modal?.data as Course | null
    const course: Course = { id: existing?.id || id(), name: String(form.get('name')), code: String(form.get('code')), instructor: String(form.get('instructor')), color: String(form.get('color')) }
    setCourses((items) => existing ? items.map((item) => item.id === existing.id ? course : item) : [...items, course]); setModal(null)
  }
  function saveAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const existing = modal?.data as Assignment | null
    const selectedStatus = form.get('status') as Status
    const due = String(form.get('due'))
    const status = selectedStatus !== 'Complete' && due < currentDate ? 'Overdue' : selectedStatus
    const gradeValue = Number(form.get('grade'))
    const assignment: Assignment = { id: existing?.id || id(), title: String(form.get('title')), courseId: String(form.get('courseId')), due, priority: form.get('priority') as Priority, status, ...(status === 'Complete' && Number.isFinite(gradeValue) && gradeValue >= 0 && gradeValue <= 100 ? { grade: gradeValue } : {}) }
    setAssignments((items) => existing ? items.map((item) => item.id === existing.id ? assignment : item) : [...items, assignment]); setModal(null)
  }
  function removeCourse(courseId: string) { if (confirm('Delete this course and its assignments?')) { setCourses((items) => items.filter((item) => item.id !== courseId)); setAssignments((items) => items.filter((item) => item.courseId !== courseId)) } }
  function removeAssignment(assignmentId: string) { setAssignments((items) => items.filter((item) => item.id !== assignmentId)) }
  const courseFor = (courseId: string) => courses.find((course) => course.id === courseId) || courses[0]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><BookOpen size={18} /></span><span>study<span className="brand-accent">/</span>space</span></div>
      <div className="term-card"><span className="eyebrow">CURRENT TERM</span><select className="term-select" value={currentTerm} onChange={(event) => selectTerm(event.target.value)} aria-label="Select current term">{Object.keys(terms).map((term) => <option key={term}>{term}</option>)}</select><button className="new-term-button" onClick={createTerm}><Plus size={13} /> New term</button><span className="term-dot">●  Week {String(termWeek).padStart(2, '0')} of 15</span></div>
      <nav><button className={activeView === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('overview')}><LayoutDashboard size={17} /> Overview</button><button className={activeView === 'courses' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('courses')}><BookOpen size={17} /> My courses <span className="nav-count">{courses.length}</span></button><button className="nav-item" onClick={() => { setActiveView('overview'); requestAnimationFrame(() => document.getElementById('assignments')?.scrollIntoView({ behavior: 'smooth' })) }}><ListTodo size={17} /> Assignments <span className="nav-count">{assignments.length}</span></button></nav>
      <div className="sidebar-bottom"><div className="tip"><Flame size={16} /><span><b>Keep your streak</b><br />You have 4 focused days.</span></div><div className="account-menu"><button className={accountOpen ? 'profile open' : 'profile'} onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu"><div className="avatar">AR</div><div><b>Alex Rivera</b><small>Computer Science</small></div><ChevronDown size={15} /></button>{accountOpen && <div className="account-dropdown" role="menu"><button role="menuitem" onClick={() => setAccountOpen(false)}><UserRound size={15} /> Profile</button><button role="menuitem" onClick={() => setAccountOpen(false)}><Settings size={15} /> Settings</button><div className="menu-divider" /><button role="menuitem" onClick={() => setAccountOpen(false)}><LogOut size={15} /> Sign out</button></div>}</div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><label className="current-day"><CalendarDays size={13} /> CURRENT DAY <input type="date" value={currentDate} onChange={(event) => setCurrentDate(event.target.value)} /></label><h1>{activeView === 'overview' ? 'Good morning, Alex.' : 'My courses'}</h1></div><button className="primary-button" onClick={() => setModal({ type: 'assignment', data: null })}><Plus size={17} /> Add assignment</button></header>
      {activeView === 'overview' ? <>
        <section className="hero-row"><div><p className="lede">A clear mind starts with a clear plan.</p><div className="progress-line"><span style={{ width: `${Math.max(progress, 7)}%` }} /></div><small>{progress}% of your assignments completed</small></div><div className="week-box"><CalendarDays size={17} /><span><b>This week</b><br />{thisWeekAssignments.length} due in the next 7 days</span></div></section>
        <section className="stats-grid"><div className="stat-card total-week"><span>TOTAL THIS WEEK</span><strong>{totalThisWeek}</strong><small>All statuses included</small></div><div className="stat-card coral"><span>ASSIGNMENTS DUE</span><strong>{dueSoon}</strong><small>Keep the momentum going</small></div><div className="stat-card teal"><span>COMPLETED</span><strong>{completed}</strong><small>{completed ? 'Nice work so far' : 'Your first win is waiting'}</small></div><div className="stat-card yellow"><span>COURSES</span><strong>{courses.length}</strong><small>Across your fall term</small></div><div className="stat-card grade"><span>AVERAGE GRADE</span><strong>{averageGrade === null ? '--' : `${averageGrade}%`}</strong><small>{gradedAssignments.length ? `From ${gradedAssignments.length} graded assignment${gradedAssignments.length === 1 ? '' : 's'}` : 'Grade completed work to begin'}</small></div><div className="stat-card overdue"><span>OVERDUE</span><strong>{overdueAssignments.length}</strong><small>{oldestOverdue ? `Oldest: ${oldestOverdue.title}` : 'You are all caught up'}</small></div></section>
      </> : <section className="courses-header"><p className="lede">Your fall term, all in one place.</p><button className="secondary-button" onClick={() => setModal({ type: 'course', data: null })}><Plus size={16} /> Add course</button></section>}
      {activeView === 'overview' && <section className="section-heading"><div><span className="eyebrow">YOUR WORKLOAD</span><h2>Assignments</h2></div><div className="filters">{(['All', 'Not started', 'In progress', 'Complete', 'Overdue'] as const).map((item) => <button key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{item}</button>)}</div></section>}
      {activeView === 'courses' ? <section className="course-grid">{courses.map((course) => <article className="course-card" key={course.id}><div className="course-color" style={{ background: course.color }} /><div className="course-card-body"><span className="course-code">{course.code}</span><h3>{course.name}</h3><p>{course.instructor}</p><div className="course-footer"><span>{assignments.filter((item) => item.courseId === course.id).length} assignments</span><span><button className="icon-button" aria-label="Edit course" onClick={() => setModal({ type: 'course', data: course })}><Edit3 size={15} /></button><button className="icon-button danger" aria-label="Delete course" onClick={() => removeCourse(course.id)}><Trash2 size={15} /></button></span></div></div></article>)}</section> : <section className="assignment-list" id="assignments">{shownAssignments.length ? shownAssignments.map((item) => { const course = courseFor(item.courseId); return <article className="assignment-row" key={item.id}><span className="assignment-dot" style={{ background: course?.color }} /><div className="assignment-main"><strong>{item.title}</strong><span>{course?.code} <i /> Due {new Date(`${item.due}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div><select className={`pill priority-${item.priority.toLowerCase()}`} value={item.priority} onChange={(event) => setAssignments((items) => items.map((entry) => entry.id === item.id ? { ...entry, priority: event.target.value as Priority } : entry))}><option>High</option><option>Medium</option><option>Low</option></select><select className={`status-select status-${item.status.toLowerCase().replace(' ', '-')}`} value={item.status} onChange={(event) => setAssignments((items) => items.map((entry) => entry.id === item.id ? { ...entry, status: event.target.value as Status } : entry))}><option>Not started</option><option>In progress</option><option>Complete</option><option>Overdue</option></select><div className="row-actions"><button className="icon-button" aria-label="Edit assignment" onClick={() => setModal({ type: 'assignment', data: item })}><Edit3 size={15} /></button><button className="icon-button danger" aria-label="Delete assignment" onClick={() => removeAssignment(item.id)}><Trash2 size={15} /></button></div></article> }) : <div className="empty-state"><Check size={22} />Nothing matches this filter.</div>}</section>}
      {activeView === 'overview' && <section className="bottom-grid"><div className="panel upcoming"><div className="panel-title"><span><span className="eyebrow">CALENDAR</span><h2>Coming up</h2></span><Clock3 size={19} /></div>{assignments.filter((item) => item.status !== 'Complete').slice(0, 3).map((item) => <div className="mini-event" key={item.id}><span className="date-box">{new Date(`${item.due}T12:00:00`).getDate()}<small>{new Date(`${item.due}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</small></span><span><b>{item.title}</b><small>{courseFor(item.courseId)?.code}</small></span></div>)}</div><div className="panel focus"><span className="eyebrow">FOCUS FOR TODAY</span><h2>One thing at a time.</h2><p>Choose a single task and give it your full attention for 25 minutes.</p><button className="secondary-button" onClick={() => setModal({ type: 'assignment', data: assignments.find((item) => item.status === 'Not started') || null })}>Start a focus session <Clock3 size={15} /></button></div></section>}
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><div className="modal"><button className="close-button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button><span className="eyebrow">{modal.type === 'course' ? 'COURSE DETAILS' : 'ASSIGNMENT DETAILS'}</span><h2>{modal.data ? `Edit ${modal.type}` : `Add ${modal.type}`}</h2>{modal.type === 'course' ? <form onSubmit={saveCourse}><label>Course name<input name="name" required defaultValue={(modal.data as Course | null)?.name} placeholder="e.g. Data Structures" /></label><div className="form-row"><label>Course code<input name="code" required defaultValue={(modal.data as Course | null)?.code} placeholder="CS 320" /></label><label>Color<input name="color" type="color" defaultValue={(modal.data as Course | null)?.color || '#e87a5d'} /></label></div><label>Instructor<input name="instructor" required defaultValue={(modal.data as Course | null)?.instructor} placeholder="Instructor name" /></label><button className="primary-button full" type="submit">Save course</button></form> : <form onSubmit={saveAssignment}><label>Assignment title<input name="title" required defaultValue={(modal.data as Assignment | null)?.title} placeholder="e.g. Reading reflection" /></label><div className="form-row"><label>Course<select name="courseId" defaultValue={(modal.data as Assignment | null)?.courseId || courses[0]?.id}>{courses.map((course) => <option value={course.id} key={course.id}>{course.code}</option>)}</select></label><label>Due date<input name="due" required type="date" defaultValue={(modal.data as Assignment | null)?.due} /></label></div><div className="form-row"><label>Priority<select name="priority" defaultValue={(modal.data as Assignment | null)?.priority || blankAssignment.priority}><option>High</option><option>Medium</option><option>Low</option></select></label><label>Status<select name="status" defaultValue={(modal.data as Assignment | null)?.status || blankAssignment.status}><option>Not started</option><option>In progress</option><option>Complete</option><option>Overdue</option></select></label></div><label>Grade <span className="field-hint">Completed assignments only, 0-100</span><input name="grade" type="number" min="0" max="100" step="0.1" defaultValue={(modal.data as Assignment | null)?.grade ?? ''} placeholder="e.g. 92" /></label><button className="primary-button full" type="submit">Save assignment</button></form>}</div></div>}
  </div>
}

export default App