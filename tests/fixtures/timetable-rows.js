const T = 'Summer 1 2026-27';
const r = (Unit, unitName, Lecturer, Day, Start, End, From, To, __row) => ({
  Term: T, Unit, 'Unit name': unitName, Lecturer, Day, Start, End, Room: 'ADCI Classroom 1', From, To, __row,
});

export const rows = [
  r('CAP302', 'Industry Capstone', 'Dr Anna Griffin', 'Mon', '09:00', '13:00', '23/11/2026', '18/12/2026', 2),
  r('CAP302', 'Industry Capstone', 'Dr Anna Griffin', 'Fri', '09:00', '13:00', '23/11/2026', '18/12/2026', 3),
  r('ORG303', 'Digital Innovation', 'Dr Maen Hawari', 'Tue', '09:00', '12:00', '24/11/2026', '10/12/2026', 4),
  r('ORG303', 'Digital Innovation', 'Dr Maen Hawari', 'Wed', '09:00', '12:00', '24/11/2026', '10/12/2026', 5),
  r('ORG303', 'Digital Innovation', 'Dr Maen Hawari', 'Thu', '09:00', '12:00', '24/11/2026', '10/12/2026', 6),
  r('CYB306', 'Security and Privacy Implications', 'Chloe Wu', 'Tue', '13:00', '16:00', '24/11/2026', '10/12/2026', 7),
  r('CYB306', 'Security and Privacy Implications', 'Chloe Wu', 'Wed', '13:00', '16:00', '24/11/2026', '10/12/2026', 8),
  r('CYB306', 'Security and Privacy Implications', 'Chloe Wu', 'Thu', '13:00', '16:00', '24/11/2026', '10/12/2026', 9),
];
