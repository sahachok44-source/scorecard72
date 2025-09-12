document



document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const newRoundBtn = document.getElementById('new-round-btn');

    let rounds = JSON.parse(localStorage.getItem('golfRounds')) || [];
    let currentRound = null;
    let activeTab = 'dashboard';

    const renderDashboard = () => {
        const stats = calculateStats();
        const recentRounds = rounds.slice(-5).reverse();

        appContent.innerHTML = `
            <div class="grid grid-cols-3">
                <div class="card"><h3>รอบที่เล่นทั้งหมด</h3><div class="value">${stats.totalRounds}</div></div>
                <div class="card"><h3>สกอร์เฉลี่ย</h3><div class="value">${stats.avgScore}</div></div>
                <div class="card"><h3>สกอร์ที่ดีที่สุด</h3><div class="value">${stats.bestScore}</div></div>
                <div class="card"><h3>Fairway Hit %</h3><div class="value">${stats.fairwayPercentage}%</div></div>
                <div class="card"><h3>GIR %</h3><div class="value">${stats.girPercentage}%</div></div>
                <div class="card"><h3>Putts เฉลี่ย</h3><div class="value">${stats.avgPutts}</div></div>
            </div>
            <h2 style="margin-top: 24px; font-size: 20px; font-weight: bold;">รอบล่าสุด</h2>
            <div id="recent-rounds-list">
                ${recentRounds.map(round => `
                    <div class="list-item">
                        <div>
                            <p style="font-weight: 500;">${round.date}</p>
                            <p style="font-size: 14px; color: #6b7280;">${round.courseName || 'ไม่ระบุสนาม'}</p>
                        </div>
                        <div class="score">${round.totalScore}</div>
                    </div>
                `).join('') || '<p style="color: #6b7280; text-align: center; padding: 32px 0;">ยังไม่มีข้อมูลการเล่น</p>'}
            </div>
        `;
    };

    const renderScorecard = () => {
        if (!currentRound) {
            appContent.innerHTML = `
                <div style="text-align: center; padding: 48px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">เริ่มบันทึกรอบใหม่</h3>
                    <p style="color: #6b7280; margin-bottom: 16px;">คลิกปุ่ม "เริ่มรอบใหม่" เพื่อเริ่มบันทึกสกอร์</p>
                </div>
            `;
            return;
        }

        appContent.innerHTML = `
            <form id="scorecard-form">
                <div class="card">
                    <h2>ข้อมูลรอบการเล่น</h2>
                    <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <label for="round-date">วันที่</label>
                            <input type="date" id="round-date" value="${currentRound.date}">
                        </div>
                        <div>
                            <label for="course-name">ชื่อสนาม</label>
                            <input type="text" id="course-name" placeholder="ระบุชื่อสนาม" value="${currentRound.courseName}">
                        </div>
                    </div>
                </div>
                
                <h2>บันทึกสกอร์แต่ละหลุม (สกอร์รวม: ${currentRound.holes.reduce((sum, h) => sum + h.score, 0)})</h2>
                <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
                    ${currentRound.holes.map((hole, index) => `
                        <div class="hole-card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h3>หลุม ${hole.hole}</h3>
                                <span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Par ${hole.par}</span>
                            </div>
                            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div><label>Par</label><input type="number" min="3" max="5" data-hole="${index}" data-field="par" value="${hole.par}"></div>
                                <div><label>สกอร์</label><input type="number" min="1" max="10" data-hole="${index}" data-field="score" value="${hole.score || ''}"></div>
                                <div><label>Putts</label><input type="number" min="0" max="5" data-hole="${index}" data-field="putts" value="${hole.putts || ''}"></div>
                                <div class="checkbox-group">
                                    <input type="checkbox" id="fairway-${index}" data-hole="${index}" data-field="fairwayHit" ${hole.fairwayHit ? 'checked' : ''} ${hole.par === 3 ? 'disabled' : ''}>
                                    <label for="fairway-${index}">Fairway Hit</label>
                                </div>
                                <div class="checkbox-group">
                                    <input type="checkbox" id="gir-${index}" data-hole="${index}" data-field="greenInRegulation" ${hole.greenInRegulation ? 'checked' : ''}>
                                    <label for="gir-${index}">GIR</label>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn">ยกเลิก</button>
                    <button type="submit" class="save-btn">บันทึกรอบ</button>
                </div>
            </form>
        `;

        document.getElementById('scorecard-form').addEventListener('submit', (e) => {
            e.preventDefault();
            saveRound();
        });

        document.querySelector('.cancel-btn').addEventListener('click', () => {
            currentRound = null;
            switchTab('dashboard');
        });

        document.getElementById('round-date').addEventListener('change', (e) => {
            currentRound.date = e.target.value;
        });

        document.getElementById('course-name').addEventListener('input', (e) => {
            currentRound.courseName = e.target.value;
        });

        document.querySelectorAll('#scorecard-form input[data-hole]').forEach(input => {
            input.addEventListener('input', (e) => {
                const { hole, field } = e.target.dataset;
                const value = e.target.type === 'checkbox' ? e.target.checked : parseInt(e.target.value) || 0;
                currentRound.holes[hole][field] = value;
                renderScorecard(); // Re-render to update total score
            });
        });
    };

    const renderHistory = () => {
        appContent.innerHTML = `
            <h2>ประวัติการเล่น</h2>
            <div id="history-list">
                ${rounds.slice().reverse().map(round => `
                    <div class="list-item">
                        <div>
                            <p style="font-weight: 500;">${round.date}</p>
                            <p style="font-size: 14px; color: #6b7280;">${round.courseName || 'ไม่ระบุสนาม'}</p>
                        </div>
                        <div class="score">${round.totalScore}</div>
                    </div>
                `).join('') || '<p style="color: #6b7280; text-align: center; padding: 32px 0;">ยังไม่มีประวัติการเล่น</p>'}
            </div>
        `;
    };

    const renderStats = () => {
        const stats = calculateStats();
        appContent.innerHTML = `
            <h2>สถิติโดยรวม</h2>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="card"><h3>รอบที่เล่นทั้งหมด</h3><div class="value">${stats.totalRounds}</div></div>
                <div class="card"><h3>สกอร์เฉลี่ย</h3><div class="value">${stats.avgScore}</div></div>
                <div class="card"><h3>สกอร์ที่ดีที่สุด</h3><div class="value">${stats.bestScore}</div></div>
                <div class="card"><h3>Fairway Hit %</h3><div class="value">${stats.fairwayPercentage}%</div></div>
                <div class="card"><h3>Green in Regulation %</h3><div class="value">${stats.girPercentage}%</div></div>
                <div class="card"><h3>Putts เฉลี่ยต่อหลุม</h3><div class="value">${stats.avgPutts}</div></div>
            </div>
            
            <div class="export-section">
                <h3>Export ข้อมูล</h3>
                <p style="color: #6b7280; margin-bottom: 16px;">ดาวน์โหลดข้อมูลการเล่นของคุณในรูปแบบ Excel</p>
                <button class="export-btn" onclick="exportToExcel()">📊 Export เป็น Excel</button>
                <button class="export-btn" onclick="exportSummaryToExcel()">📈 Export สถิติสรุป</button>
            </div>
        `;
    };

    const calculateStats = () => {
        if (rounds.length === 0) return { totalRounds: 0, avgScore: 0, bestScore: 0, fairwayPercentage: 0, girPercentage: 0, avgPutts: 0 };

        const totalRounds = rounds.length;
        const scores = rounds.map(r => r.totalScore).filter(s => s > 0);
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
        const bestScore = scores.length > 0 ? Math.min(...scores) : 0;
        
        const allHoles = rounds.flatMap(r => r.holes || []);
        const fairwayHits = allHoles.filter(h => h.fairwayHit).length;
        const totalFairways = allHoles.filter(h => h.par > 3).length;
        const fairwayPercentage = totalFairways > 0 ? ((fairwayHits / totalFairways) * 100).toFixed(1) : 0;
        
        const girHits = allHoles.filter(h => h.greenInRegulation).length;
        const girPercentage = allHoles.length > 0 ? ((girHits / allHoles.length) * 100).toFixed(1) : 0;
        
        const totalPutts = allHoles.reduce((sum, h) => sum + (h.putts || 0), 0);
        const avgPutts = allHoles.length > 0 ? (totalPutts / allHoles.length).toFixed(1) : 0;

        return { totalRounds, avgScore, bestScore, fairwayPercentage, girPercentage, avgPutts };
    };

    const startNewRound = () => {
        currentRound = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            courseName: '',
            totalScore: 0,
            holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, score: 0, fairwayHit: false, greenInRegulation: false, putts: 0 }))
        };
        switchTab('scorecard');
    };

    const saveRound = () => {
        if (currentRound) {
            currentRound.totalScore = currentRound.holes.reduce((sum, hole) => sum + hole.score, 0);
            const existingIndex = rounds.findIndex(r => r.id === currentRound.id);
            if (existingIndex >= 0) {
                rounds[existingIndex] = currentRound;
            } else {
                rounds.push(currentRound);
            }
            localStorage.setItem('golfRounds', JSON.stringify(rounds));
            currentRound = null;
            switchTab('dashboard');
        }
    };

    const switchTab = (tabId) => {
        activeTab = tabId;
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        renderContent();
    };

    const renderContent = () => {
        if (activeTab === 'dashboard') renderDashboard();
        else if (activeTab === 'scorecard') renderScorecard();
        else if (activeTab === 'history') renderHistory();
        else if (activeTab === 'stats') renderStats();
    };

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    newRoundBtn.addEventListener('click', startNewRound);

    // Initial render
    renderContent();
});

// Export functions (global scope for onclick handlers)
function exportToExcel() {
    const rounds = JSON.parse(localStorage.getItem('golfRounds')) || [];
    
    if (rounds.length === 0) {
        alert('ไม่มีข้อมูลสำหรับ Export');
        return;
    }

    // สร้างข้อมูลสำหรับ Excel
    const excelData = [];
    
    rounds.forEach(round => {
        round.holes.forEach(hole => {
            excelData.push({
                'วันที่': round.date,
                'สนาม': round.courseName || 'ไม่ระบุ',
                'หลุม': hole.hole,
                'Par': hole.par,
                'สกอร์': hole.score,
                'Putts': hole.putts || 0,
                'Fairway Hit': hole.fairwayHit ? 'Yes' : 'No',
                'GIR': hole.greenInRegulation ? 'Yes' : 'No',
                'สกอร์รวมรอบ': round.totalScore
            });
        });
    });

    // สร้าง workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Golf Scores");

    // ดาวน์โหลดไฟล์
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Golf_Scores_${today}.xlsx`);
}

function exportSummaryToExcel() {
    const rounds = JSON.parse(localStorage.getItem('golfRounds')) || [];
    
    if (rounds.length === 0) {
        alert('ไม่มีข้อมูลสำหรับ Export');
        return;
    }

    // สร้างข้อมูลสรุปแต่ละรอบ
    const summaryData = rounds.map(round => {
        const holes = round.holes || [];
        const fairwayHits = holes.filter(h => h.fairwayHit).length;
        const totalFairways = holes.filter(h => h.par > 3).length;
        const girHits = holes.filter(h => h.greenInRegulation).length;
        const totalPutts = holes.reduce((sum, h) => sum + (h.putts || 0), 0);
        
        return {
            'วันที่': round.date,
            'สนาม': round.courseName || 'ไม่ระบุ',
            'สกอร์รวม': round.totalScore,
            'Fairway Hit': fairwayHits,
            'Total Fairways': totalFairways,
            'Fairway %': totalFairways > 0 ? ((fairwayHits / totalFairways) * 100).toFixed(1) + '%' : '0%',
            'GIR': girHits,
            'GIR %': holes.length > 0 ? ((girHits / holes.length) * 100).toFixed(1) + '%' : '0%',
            'Total Putts': totalPutts,
            'Putts เฉลี่ย': holes.length > 0 ? (totalPutts / holes.length).toFixed(1) : '0'
        };
    });

    // สร้าง workbook
    const ws = XLSX.utils.json_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Golf Summary");

    // ดาวน์โหลดไฟล์
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Golf_Summary_${today}.xlsx`);
}


