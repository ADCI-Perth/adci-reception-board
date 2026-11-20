const r = (Type, Name, Start, End, __row, Term = '', banner = '') => ({
  Type, Name, Start, End, Term, 'Banner text': banner, __row,
});

export const rows = [
  r('Study', 'Study Week', '02/11/2026', '06/11/2026', 2, 'Jul 2026'),
  r('Exam', 'Exam Week 1', '09/11/2026', '13/11/2026', 3, 'Jul 2026'),
  r('Exam', 'Exam Week 2', '16/11/2026', '20/11/2026', 4, 'Jul 2026'),
  r('Summer', 'Summer 1 Week 1', '23/11/2026', '27/11/2026', 5, 'Summer 1 2026-27'),
  r('Summer', 'Summer 1 Week 2', '30/11/2026', '04/12/2026', 6, 'Summer 1 2026-27'),
  r('Summer', 'Summer 1 Week 3', '07/12/2026', '11/12/2026', 7, 'Summer 1 2026-27'),
  r('Assessment', 'Summer 1 Assessment Week', '14/12/2026', '18/12/2026', 8, 'Summer 1 2026-27'),
  r('Christmas', 'Christmas & New Year', '21/12/2026', '01/01/2027', 9),
  r('Summer', 'Summer 2 Week 1', '11/01/2027', '15/01/2027', 10, 'Summer 2 2026-27'),
  r('Summer', 'Summer 2 Week 2', '18/01/2027', '22/01/2027', 11, 'Summer 2 2026-27'),
  r('Summer', 'Summer 2 Week 3', '25/01/2027', '29/01/2027', 12, 'Summer 2 2026-27'),
  r('Assessment', 'Summer 2 Assessment Week', '01/02/2027', '05/02/2027', 13, 'Summer 2 2026-27'),
  r('Orientation', 'Orientation Week', '15/02/2027', '19/02/2027', 14),
  r('Teaching', 'Teaching Week 1', '22/02/2027', '26/02/2027', 15, 'Feb 2027'),
  r('Event', 'Census Date', '20/08/2026', '20/08/2026', 16),
  r('Event', 'Test Event', '24/11/2026', '24/11/2026', 17, '', 'Library closed today'),
  r('Holiday', 'Bad Type', '01/03/2027', '05/03/2027', 18),
  { Type: '', Name: '', Start: '', End: '', Term: '', 'Banner text': '', __row: 19 },
];
