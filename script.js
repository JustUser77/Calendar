function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function fetchCuaca(kota = 'Medan') {
  const apiKey = '81273c86823c5c51a6dd71c761488de8';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${kota}&appid=${apiKey}&units=metric&lang=id`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const suhu = Math.round(data.main.temp);
    const kondisi = data.weather[0].description;
    const ikon = data.weather[0].icon;
    const ikonUrl = `https://openweathermap.org/img/wn/${ikon}@2x.png`;

    const infoEl = document.getElementById('weather-info');
    infoEl.innerHTML = `<img src="${ikonUrl}" alt="${kondisi}" style="vertical-align:middle;width:32px;height:32px;">
      <span style="font-size:14px;">${kota}: ${suhu}°C, ${kondisi}</span>`;
  } catch (err) {
    console.error('Gagal ambil data cuaca:', err);
    document.getElementById('weather-info').textContent = 'Cuaca tidak tersedia';
  }
}

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let currentView = 'month';
let tanggalMerah = {};

const monthYearEl = document.getElementById('month-year');
const calendarEl = document.getElementById('calendar');
const modal = document.getElementById('event-modal');
const selectedDateEl = document.getElementById('selected-date');
const eventTitleEl = document.getElementById('event-title');
const eventDescEl = document.getElementById('event-desc');
const saveBtn = document.getElementById('save-event');
const closeBtn = document.getElementById('close-modal');

const dropdown = document.getElementById('city-select');
if (dropdown) {
  dropdown.addEventListener('change', (e) => {
    fetchCuaca(e.target.value);
  });
}

document.getElementById('prev-month').addEventListener('click', () => {
  if (currentView === 'month' || currentView === 'week') {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    fetchTanggalMerah(currentYear);
  } else if (currentView === 'year') {
    currentYear--;
    renderCalendar();
  }
});

document.getElementById('next-month').addEventListener('click', () => {
  if (currentView === 'month' || currentView === 'week') {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    fetchTanggalMerah(currentYear);
  } else if (currentView === 'year') {
    currentYear++;
    renderCalendar();
  }
});

document.getElementById('btn-add').addEventListener('click', () => {
  const today = new Date();
  const dateStr = formatDate(today);
  openModal(dateStr);
});

function editEvent(date, index) {
  const events = getEvents(date);
  const ev = events[index];
  eventTitleEl.value = ev.title;
  eventDescEl.value = ev.desc;
  events.splice(index, 1);
  localStorage.setItem(`event-${date}`, JSON.stringify(events));
}

function deleteEvent(date, index) {
  const events = getEvents(date);
  events.splice(index, 1);
  localStorage.setItem(`event-${date}`, JSON.stringify(events));
  openModal(date);
  renderCalendar();
}

function getEvents(date) {
  const data = localStorage.getItem(`event-${date}`);
  return data ? JSON.parse(data) : [];
}
async function fetchTanggalMerah(year) {
  const url = `https://api-harilibur.vercel.app/api?year=${year}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    tanggalMerah = {};
    data.forEach(item => {
      if (item.is_national_holiday) {
        tanggalMerah[item.holiday_date] = item.holiday_name;
      }
    });
    renderCalendar();
  } catch (err) {
    console.error('Gagal ambil tanggal merah:', err);
    tanggalMerah = {};
    renderCalendar();
  }
}

function renderCalendar() {
  if (currentView === 'month') renderMonthView();
  else if (currentView === 'week') renderWeekView();
  else if (currentView === 'year') renderYearView();
  else if (currentView === 'agenda') renderAgendaView();
}

function renderMonthView() {
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayStr = formatDate(new Date());

  monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  calendarEl.innerHTML = '';
  calendarEl.style.display = 'grid';
  calendarEl.style.gridTemplateColumns = 'repeat(7, 1fr)';

  const startDay = (firstDay + 6) % 7;
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    calendarEl.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = formatDate(date);
    const events = getEvents(dateStr);

    const cell = document.createElement('div');
    cell.innerHTML = `<div class="day-number">${day}</div>`;

    if (dateStr === todayStr) {
      cell.classList.add('hari-ini');
    }

    if (tanggalMerah[dateStr]) {
      cell.classList.add('tanggal-merah');
      const libur = document.createElement('div');
      libur.textContent = `🟥 ${tanggalMerah[dateStr]}`;
      libur.style.fontSize = '12px';
      libur.style.color = 'red';
      cell.appendChild(libur);
    }

    if (events.length > 0) {
      cell.classList.add('has-event');
      events.forEach(ev => {
        const tag = document.createElement('div');
        tag.textContent = `📌 ${ev.title}`;
        tag.style.fontSize = '12px';
        cell.appendChild(tag);
      });
    }

    cell.addEventListener('click', () => openModal(dateStr));
    calendarEl.appendChild(cell);
  }
}

function renderWeekView() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const todayStr = formatDate(new Date());

  calendarEl.innerHTML = '';
  calendarEl.style.display = 'block';
  monthYearEl.textContent = `Minggu ${startOfWeek.toLocaleDateString('id-ID')}`;

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = formatDate(date);
    const events = getEvents(dateStr);

    const cell = document.createElement('div');
    cell.innerHTML = `<div class="day-number">${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>`;

    if (dateStr === todayStr) {
      cell.classList.add('hari-ini');
    }

    if (tanggalMerah[dateStr]) {
      cell.classList.add('tanggal-merah');
      const libur = document.createElement('div');
      libur.textContent = `🟥 ${tanggalMerah[dateStr]}`;
      libur.style.fontSize = '12px';
      libur.style.color = 'red';
      cell.appendChild(libur);
    }

    if (events.length > 0) {
      cell.classList.add('has-event');
      events.forEach(ev => {
        const tag = document.createElement('div');
        tag.textContent = `📌 ${ev.title}`;
        tag.style.fontSize = '12px';
        cell.appendChild(tag);
      });
    }

    cell.addEventListener('click', () => openModal(dateStr));
    calendarEl.appendChild(cell);
  }
}
function renderYearView() {
  calendarEl.innerHTML = '';
  calendarEl.style.display = 'grid';
  calendarEl.style.gridTemplateColumns = 'repeat(3, 1fr)';
  monthYearEl.textContent = `Tahun ${currentYear}`;
  const today = new Date();

  for (let m = 0; m < 12; m++) {
    const monthBox = document.createElement('div');
    const monthName = new Date(currentYear, m).toLocaleString('id-ID', { month: 'long' });
    const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
    let totalEvents = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      totalEvents += getEvents(dateStr).length;
    }

    monthBox.innerHTML = `<strong>${monthName}</strong><br/>📌 ${totalEvents} catatan`;

    const isCurrentMonth = currentYear === today.getFullYear() && m === today.getMonth();
    if (isCurrentMonth) {
      monthBox.classList.add('hari-ini');
    }

    monthBox.style.padding = '10px';
    monthBox.style.border = '1px solid #ccc';
    monthBox.style.borderRadius = '6px';
    monthBox.style.background = '#fff';
    monthBox.style.cursor = 'pointer';
    monthBox.addEventListener('click', () => {
      currentMonth = m;
      currentView = 'month';
      fetchTanggalMerah(currentYear);
    });

    calendarEl.appendChild(monthBox);
  }
}

function renderAgendaView() {
  calendarEl.innerHTML = '';
  calendarEl.style.display = 'block';
  monthYearEl.textContent = 'Agenda Mendatang';

  const today = new Date();
  const todayStr = formatDate(today);
  const items = [];

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = formatDate(date);
    const events = getEvents(dateStr);
    if (events.length > 0) {
      const item = document.createElement('div');
      item.style.background = '#fff';
      item.style.padding = '10px';
      item.style.marginBottom = '8px';
      item.style.borderRadius = '6px';
      item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      item.innerHTML = `<strong>${dateStr === todayStr ? '🔵 ' : ''}${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>`;
      events.forEach(ev => {
        const e = document.createElement('div');
        e.textContent = `📌 ${ev.title} — ${ev.desc}`;
        e.style.fontSize = '13px';
        item.appendChild(e);
      });
      items.push(item);
    }
  }

  if (items.length === 0) {
    calendarEl.innerHTML = '<p>Tidak ada catatan mendatang.</p>';
  } else {
    items.forEach(i => calendarEl.appendChild(i));
  }
}

function openModal(dateStr) {
  modal.classList.remove('hidden');
  selectedDateEl.textContent = `📅 ${dateStr}`;
  selectedDateEl.dataset.date = dateStr;
  eventTitleEl.value = '';
  eventDescEl.value = '';

  const events = getEvents(dateStr);
  const existing = document.createElement('div');
  existing.innerHTML = '<hr><strong>Catatan Sebelumnya:</strong>';
  events.forEach((ev, index) => {
    const row = document.createElement('div');
    row.innerHTML = `
      <div style="font-size:14px;">
        📌 <strong>${ev.title}</strong><br/>
        <small>${ev.desc}</small><br/>
        <button onclick="editEvent('${dateStr}', ${index})">✏️ Edit</button>
        <button onclick="deleteEvent('${dateStr}', ${index})">🗑️ Hapus</button>
      </div>
    `;
    existing.appendChild(row);
  });

  const modalContent = modal.querySelector('.modal-content');
  const oldList = modalContent.querySelector('.event-list');
  if (oldList) oldList.remove();
  existing.classList.add('event-list');
  modalContent.appendChild(existing);
}
closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

saveBtn.addEventListener('click', () => {
  const date = selectedDateEl.dataset.date;
  const title = eventTitleEl.value.trim();
  const desc = eventDescEl.value.trim();
  if (!title) return alert('Judul tidak boleh kosong');

  const events = getEvents(date);
  events.push({ title, desc });
  localStorage.setItem(`event-${date}`, JSON.stringify(events));
  modal.classList.add('hidden');
  renderCalendar();
});

document.querySelectorAll('.view-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    if (currentView === 'month' || currentView === 'week') {
      fetchTanggalMerah(currentYear);
    } else {
      renderCalendar();
    }
  });
});

document.getElementById('btn-today').addEventListener('click', () => {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  currentDate = now;
  currentView = 'month';
  document.querySelectorAll('.view-tabs button').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="month"]').classList.add('active');
  fetchTanggalMerah(currentYear);
});

document.getElementById('btn-settings').addEventListener('click', () => {
  document.getElementById('dropdown-panel').classList.toggle('hidden');
});

document.getElementById('toggle-cuaca').addEventListener('click', () => {
  const panel = document.getElementById('weather-panel');
  if (panel) {
    panel.classList.toggle('hidden');
    const visible = !panel.classList.contains('hidden');
    localStorage.setItem('cuaca-visible', visible ? '1' : '0');
  }
});

document.getElementById('toggle-theme').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('tema-gelap', isDark ? '1' : '0');
});

document.addEventListener('DOMContentLoaded', () => {
  const defaultTab = document.querySelector('[data-view="month"]');
  if (defaultTab && !defaultTab.classList.contains('active')) {
    defaultTab.classList.add('active');
  }
  currentView = 'month';
  fetchTanggalMerah(currentYear);

  const kotaAwal = document.getElementById('city-select')?.value || 'Medan';
  fetchCuaca(kotaAwal);

  const savedTheme = localStorage.getItem('tema-gelap');
  if (savedTheme === '1') {
    document.body.classList.add('dark-mode');
  }

  const cuacaVisible = localStorage.getItem('cuaca-visible');
  if (cuacaVisible === '0') {
    document.getElementById('weather-panel')?.classList.add('hidden');
  }
  document.addEventListener('click', (e) => {
    setTimeout(() => {
      const panel = document.getElementById('dropdown-panel');
      const toggleBtn = document.getElementById('btn-settings');
      if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
        panel.classList.add('hidden');
      }
    }, 10);
  });
});
  

