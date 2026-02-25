// ===================================
// TALEVO KARIYER — CRM API Integration
// ===================================

// API Configuration
const API_BASE = 'https://crm.talevo.com.tr/api'; // Production
// const API_BASE = 'https://web-production-03d65.up.railway.app/api'; // Fallback

let allPositions = [];

// Load Positions from CRM API
async function loadPositions() {
    const loading = document.getElementById('positionsLoading');
    const empty = document.getElementById('positionsEmpty');
    const grid = document.getElementById('positionsGrid');
    const count = document.getElementById('positionsCount');

    try {
        const response = await fetch(`${API_BASE}/positions/`);
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        allPositions = data.positions || data;
        
        loading.style.display = 'none';
        
        if (allPositions.length === 0) {
            empty.style.display = 'block';
            return;
        }
        
        populateFilters(allPositions);
        renderPositions(allPositions);
        count.textContent = `${allPositions.length} açık pozisyon bulundu`;
        
    } catch (error) {
        console.error('API Error:', error);
        loading.style.display = 'none';
        
        // Show demo data if API unavailable
        allPositions = getDemoPositions();
        populateFilters(allPositions);
        renderPositions(allPositions);
        count.innerHTML = `<span style="color: var(--orange);">Demo veri gösteriliyor — CRM API bağlantısı bekleniyor</span>`;
    }
}

// Populate Filter Dropdowns
function populateFilters(positions) {
    const departments = [...new Set(positions.map(p => p.department).filter(Boolean))];
    const locations = [...new Set(positions.map(p => p.location).filter(Boolean))];
    const experiences = [...new Set(positions.map(p => p.experience_level).filter(Boolean))];
    
    const deptSelect = document.getElementById('filterDepartment');
    departments.forEach(d => {
        deptSelect.innerHTML += `<option value="${d}">${d}</option>`;
    });
    
    const locSelect = document.getElementById('filterLocation');
    locations.forEach(l => {
        locSelect.innerHTML += `<option value="${l}">${l}</option>`;
    });
    
    const expSelect = document.getElementById('filterExperience');
    experiences.forEach(e => {
        expSelect.innerHTML += `<option value="${e}">${e}</option>`;
    });
}

// Render Position Cards
function renderPositions(positions) {
    const grid = document.getElementById('positionsGrid');
    const count = document.getElementById('positionsCount');
    const empty = document.getElementById('positionsEmpty');
    
    if (positions.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        count.textContent = 'Filtrelere uygun pozisyon bulunamadı';
        return;
    }
    
    empty.style.display = 'none';
    count.textContent = `${positions.length} açık pozisyon bulundu`;
    
    grid.innerHTML = positions.map(pos => {
        const urgencyClass = pos.urgency === 'high' ? 'urgency-high' : 
                            pos.urgency === 'medium' ? 'urgency-medium' : 'urgency-low';
        const urgencyText = pos.urgency === 'high' ? 'Acil' : 
                           pos.urgency === 'medium' ? 'Normal' : 'Düşük';
        
        const skills = (pos.required_skills || pos.skills || '').split(',').slice(0, 4);
        
        const date = pos.created_at ? new Date(pos.created_at).toLocaleDateString('tr-TR') : '';
        
        return `
            <div class="position-card" onclick="openApplyModal('${pos.uuid || pos.id}', '${escapeHtml(pos.title)}', '${escapeHtml(pos.company_name || '')}')">
                <div class="position-header">
                    <h3>${escapeHtml(pos.title)}</h3>
                    ${pos.urgency ? `<span class="position-urgency ${urgencyClass}">${urgencyText}</span>` : ''}
                </div>
                ${pos.company_name ? `<div class="position-company">${escapeHtml(pos.company_name)}</div>` : ''}
                <div class="position-meta">
                    ${pos.location ? `<span><i class="bi bi-geo-alt"></i> ${escapeHtml(pos.location)}</span>` : ''}
                    ${pos.department ? `<span><i class="bi bi-building"></i> ${escapeHtml(pos.department)}</span>` : ''}
                    ${pos.experience_level ? `<span><i class="bi bi-briefcase"></i> ${escapeHtml(pos.experience_level)}</span>` : ''}
                </div>
                ${skills.length > 0 ? `
                    <div class="position-skills">
                        ${skills.map(s => `<span class="skill-tag">${escapeHtml(s.trim())}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="position-footer">
                    <span class="position-date">${date}</span>
                    <button class="position-apply">
                        Başvur <i class="bi bi-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Filter Positions
function filterPositions() {
    const dept = document.getElementById('filterDepartment').value;
    const loc = document.getElementById('filterLocation').value;
    const exp = document.getElementById('filterExperience').value;
    const search = document.getElementById('filterSearch').value.toLowerCase();
    
    const filtered = allPositions.filter(p => {
        if (dept && p.department !== dept) return false;
        if (loc && p.location !== loc) return false;
        if (exp && p.experience_level !== exp) return false;
        if (search && !p.title.toLowerCase().includes(search) && 
            !(p.company_name || '').toLowerCase().includes(search)) return false;
        return true;
    });
    
    renderPositions(filtered);
}

// Attach filter events
document.getElementById('filterDepartment')?.addEventListener('change', filterPositions);
document.getElementById('filterLocation')?.addEventListener('change', filterPositions);
document.getElementById('filterExperience')?.addEventListener('change', filterPositions);
document.getElementById('filterSearch')?.addEventListener('input', filterPositions);

// Modal Functions
function openApplyModal(positionUuid, title, company) {
    const modal = document.getElementById('applyModal');
    const form = document.getElementById('applicationForm');
    const success = document.getElementById('applicationSuccess');
    
    document.getElementById('positionUuid').value = positionUuid;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalSubtitle').textContent = company;
    
    form.style.display = 'block';
    success.style.display = 'none';
    document.getElementById('formMessage').style.display = 'none';
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('applyModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('applyModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

// File Upload Label
const fileInput = document.getElementById('appCv');
if (fileInput) {
    fileInput.addEventListener('change', () => {
        const label = document.getElementById('fileLabel');
        if (fileInput.files.length > 0) {
            label.textContent = fileInput.files[0].name;
            label.style.color = 'var(--orange)';
        }
    });
}

// Submit Application
const applicationForm = document.getElementById('applicationForm');
if (applicationForm) {
    applicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('submitBtn');
        const msg = document.getElementById('formMessage');
        
        btn.disabled = true;
        btn.innerHTML = '<span>Gönderiliyor...</span> <div class="loader" style="width:20px;height:20px;border-width:2px;margin:0;"></div>';
        
        const formData = new FormData(applicationForm);
        
        try {
            const response = await fetch(`${API_BASE}/apply/`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                applicationForm.style.display = 'none';
                document.getElementById('applicationSuccess').style.display = 'block';
            } else {
                msg.className = 'form-message error';
                msg.textContent = data.message || data.error || 'Bir hata oluştu. Lütfen tekrar deneyin.';
                msg.style.display = 'block';
            }
        } catch (error) {
            msg.className = 'form-message error';
            msg.textContent = 'Bağlantı hatası. Lütfen daha sonra tekrar deneyin.';
            msg.style.display = 'block';
        }
        
        btn.disabled = false;
        btn.innerHTML = '<span>Başvuruyu Gönder</span> <i class="bi bi-send"></i>';
    });
}

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Demo Positions (shown when API is unavailable)
function getDemoPositions() {
    return [
        {
            id: '1',
            uuid: 'demo-1',
            title: 'Senior Yazılım Mühendisi',
            company_name: 'Teknoloji A.Ş.',
            department: 'Teknoloji',
            location: 'İstanbul',
            experience_level: 'Kıdemli (5+ yıl)',
            urgency: 'high',
            required_skills: 'Python, Django, PostgreSQL, Docker',
            created_at: new Date().toISOString(),
            description: 'Backend development pozisyonu'
        },
        {
            id: '2',
            uuid: 'demo-2',
            title: 'İnsan Kaynakları Uzmanı',
            company_name: 'Üretim Ltd.',
            department: 'İnsan Kaynakları',
            location: 'Ankara',
            experience_level: 'Orta (3-5 yıl)',
            urgency: 'medium',
            required_skills: 'İK Süreçleri, SAP HR, İş Hukuku',
            created_at: new Date().toISOString(),
            description: 'İK operasyonları pozisyonu'
        },
        {
            id: '3',
            uuid: 'demo-3',
            title: 'Finans Müdürü',
            company_name: 'Holding A.Ş.',
            department: 'Finans',
            location: 'İstanbul',
            experience_level: 'Direktör (10+ yıl)',
            urgency: 'high',
            required_skills: 'IFRS, Bütçe Yönetimi, SAP FI, Excel',
            created_at: new Date().toISOString(),
            description: 'Finans departmanı yönetimi'
        },
        {
            id: '4',
            uuid: 'demo-4',
            title: 'Dijital Pazarlama Uzmanı',
            company_name: 'E-Ticaret A.Ş.',
            department: 'Pazarlama',
            location: 'İzmir',
            experience_level: 'Başlangıç (0-2 yıl)',
            urgency: 'low',
            required_skills: 'Google Ads, Meta Ads, SEO, Analytics',
            created_at: new Date().toISOString(),
            description: 'Dijital pazarlama pozisyonu'
        }
    ];
}

// Initialize
document.addEventListener('DOMContentLoaded', loadPositions);
