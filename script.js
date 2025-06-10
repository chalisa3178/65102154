const apiUrl = 'http://localhost:3001/dailyRecords';

const form = document.getElementById('daily-form');
const historyContainer = document.getElementById('record-history');
const summaryContainer = document.getElementById('activity-summary');

let editId = null;

// บันทึก/แก้ไขข้อมูล
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const record = {
    date: document.getElementById('date').value,
    waterIntake: parseInt(document.getElementById('waterIntake').value),
    sleepHours: parseFloat(document.getElementById('sleepHours').value),
    exercise: document.getElementById('exercise').value,
    stressLevel: document.getElementById('stressLevel').value
  };

  if (editId) {
    await fetch(`${apiUrl}/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    editId = null;
  } else {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  }

  form.reset();
  loadRecords();
});

// โหลดข้อมูลย้อนหลัง
async function loadRecords() {
  const res = await fetch(apiUrl);
  const data = await res.json();

  historyContainer.innerHTML = '';
  data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(rec => {
    const el = document.createElement('div');
    el.className = 'record-item';
    el.innerHTML = `
      <strong>${rec.date}</strong><br>
      ดื่มน้ำ: ${rec.waterIntake ?? '-'} ml<br>
      นอน: ${rec.sleepHours ?? '-'} ชม.<br>
      ออกกำลังกาย: ${rec.exercise || '-'}<br>
      ความเครียด: ${rec.stressLevel || '-'}<br>
      <button onclick="editRecord(${rec.id})">แก้ไข</button>
      <button onclick="deleteRecord(${rec.id})">ลบ</button>
      <hr>
    `;
    historyContainer.appendChild(el);
  });
}

   function displayRecords() {
            const historyDiv = document.getElementById('record-history');
            
            if (healthRecords.length === 0) {
                historyDiv.innerHTML = '<div style="text-align: center; color: #999; font-style: italic; padding: 40px;">ยังไม่มีข้อมูลการบันทึก กรุณาเริ่มบันทึกข้อมูลสุขภาพของคุณ</div>';
                return;
            }

            historyDiv.innerHTML = healthRecords.map(record => `
                <div class="record-item">
                    <div class="record-date">${formatDate(record.date)}</div>
                    <div class="record-details">
                        <div class="detail-item">
                            <div class="detail-icon water-icon">💧</div>
                            <span>น้ำ: ${record.waterIntake || 'ไม่ระบุ'} ml</span>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon sleep-icon">😴</div>
                            <span>นอน: ${record.sleepHours || 'ไม่ระบุ'} ชม.</span>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon exercise-icon">🏃‍♂️</div>
                            <span>ออกกำลังกาย: ${record.exercise || 'ไม่ระบุ'}</span>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon stress-icon">😰</div>
                            <span>ความเครียด: ${getStressEmoji(record.stressLevel)} ${record.stressLevel}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const thaiDate = date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            return thaiDate;
        }

        function getStressEmoji(level) {
            switch(level) {
                case 'ต่ำ': return '😌';
                case 'ปานกลาง': return '😐';
                case 'สูง': return '😰';
                default: return '😐';
            }
        }

        function generateSummary(period) {
            const summaryDiv = document.getElementById('activity-summary');
            const buttons = document.querySelectorAll('.summary-section button');
            
            // Show loading state
            buttons.forEach(btn => btn.disabled = true);
            summaryDiv.innerHTML = '<div class="loading" style="margin: 40px auto;"></div><div style="margin-top: 20px;">กำลังสร้างสรุป...</div>';

            setTimeout(() => {
                if (healthRecords.length === 0) {
                    summaryDiv.innerHTML = '<div style="color: #999; font-style: italic;">ไม่มีข้อมูลสำหรับสร้างสรุป กรุณาบันทึกข้อมูลก่อน</div>';
                    buttons.forEach(btn => btn.disabled = false);
                    return;
                }

                const now = new Date();
                const periodDays = period === 'week' ? 7 : 30;
                const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));

                const periodRecords = healthRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= startDate && recordDate <= now;
                });

                if (periodRecords.length === 0) {
                    summaryDiv.innerHTML = `<div style="color: #999; font-style: italic;">ไม่มีข้อมูลใน${period === 'week' ? 'สัปดาห์' : 'เดือน'}ที่ผ่านมา</div>`;
                    buttons.forEach(btn => btn.disabled = false);
                    return;
                }

                // Calculate averages
                const totalWater = periodRecords.reduce((sum, record) => sum + (parseInt(record.waterIntake) || 0), 0);
                const totalSleep = periodRecords.reduce((sum, record) => sum + (parseFloat(record.sleepHours) || 0), 0);
                const avgWater = Math.round(totalWater / periodRecords.length);
                const avgSleep = (totalSleep / periodRecords.length).toFixed(1);

                // Count stress levels
                const stressCount = { 'ต่ำ': 0, 'ปานกลาง': 0, 'สูง': 0 };
                periodRecords.forEach(record => {
                    if (record.stressLevel) stressCount[record.stressLevel]++;
                });

                // Count exercise days
                const exerciseDays = periodRecords.filter(record => record.exercise && record.exercise.trim()).length;

                               summaryDiv.innerHTML = `
                    <div class="summary-content">
                        <h3 style="color: #667eea; margin-bottom: 20px; text-align: center;">
                            📊 สรุป${period === 'week' ? 'สัปดาห์' : 'เดือน'}ที่ผ่านมา (${periodRecords.length} วัน)
                        </h3>
                        <div class="summary-stat">
                            <span class="stat-label">💧 การดื่มน้ำเฉลี่ย</span>
                            <span class="stat-value">${avgWater} ml/วัน</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">😴 ชั่วโมงการนอนเฉลี่ย</span>
                            <span class="stat-value">${avgSleep} ชม./วัน</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">🏃‍♂️ จำนวนวันที่ออกกำลังกาย</span>
                            <span class="stat-value">${exerciseDays} วัน</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">😌 ความเครียด (ต่ำ)</span>
                            <span class="stat-value">${stressCount['ต่ำ']} วัน</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">😐 ความเครียด (ปานกลาง)</span>
                            <span class="stat-value">${stressCount['ปานกลาง']} วัน</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">😰 ความเครียด (สูง)</span>
                            <span class="stat-value">${stressCount['สูง']} วัน</span>
                        </div>
                    </div>
                `;
                // Re-enable buttons
                buttons.forEach(btn => btn.disabled = false);
            }, 1000);
            
        }
      
// โหลดทันทีเมื่อเข้าเว็บ
loadRecords();
