<script>
    // VAULTFORGE Core v1.0
    // Firebase Config - Replace with your own
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // Local Storage Keys
    const LS_KEYS = {
        USER: 'vf_user',
        MEMBERS: 'vf_members',
        SELLERS: 'vf_sellers',
        CONTRACTS: 'vf_contracts',
        COMPS: 'vf_comps',
        MESSAGES: 'vf_messages',
        PROFILE: 'vf_profile'
    };

    // Login Logic
    function handleLogin() {
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        const error = document.getElementById('loginError');
        
        if(user === 'admin' && pass === 'vault2024') {
            localStorage.setItem(LS_KEYS.USER, user);
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'block';
            initApp();
        } else {
            error.style.display = 'block';
        }
    }

    function handleLogout() {
        localStorage.removeItem(LS_KEYS.USER);
        location.reload();
    }

    function checkAuth() {
        if(localStorage.getItem(LS_KEYS.USER)) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'block';
            initApp();
        }
    }
/* END PART 7 OF 30 - LINE 665 */// Tab Navigation
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.tab).classList.add('active');
        });
    });

    // Modal Controls
    function openMemberModal() { 
        clearModal('memberModal');
        document.getElementById('memberModal').classList.add('active'); 
    }
    function openSellerModal() { 
        clearModal('sellerModal');
        document.getElementById('sellerModal').classList.add('active'); 
    }
    function openContractModal() { 
        clearModal('contractModal');
        document.getElementById('contractModal').classList.add('active'); 
    }
    function closeModal(id) { 
        document.getElementById(id).classList.remove('active'); 
    }
    function clearModal(id) {
        document.querySelectorAll(`#${id} input, #${id} textarea, #${id} select`).forEach(el => {
            if(el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
        });
    }

    // Data Functions
    function getData(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Profile Functions
    function saveProfile() {
        const profile = {
            name: document.getElementById('profileName').value,
            email: document.getElementById('profileEmail').value,
            phone: document.getElementById('profilePhone').value,
            market: document.getElementById('profileMarket').value
        };
        saveData(LS_KEYS.PROFILE, profile);
        showToast('Profile saved', 'success');
    }

    function loadProfile() {
        const profile = getData(LS_KEYS.PROFILE);
        if(profile.name) {
            document.getElementById('profileName').value = profile.name || '';
            document.getElementById('profileEmail').value = profile.email || '';
            document.getElementById('profilePhone').value = profile.phone || '';
            document.getElementById('profileMarket').value = profile.market || 'Atlanta, GA';
        }
    }

    // Member Functions
    function saveMember() {
        const members = getData(LS_KEYS.MEMBERS);
        const member = {
            id: generateId(),
            name: document.getElementById('memberName').value,
            role: document.getElementById('memberRole').value,
            market: document.getElementById('memberMarket').value,
            email: document.getElementById('memberEmail').value,
            phone: document.getElementById('memberPhone').value,
            notes: document.getElementById('memberNotes').value,
            status: 'Active',
            dateAdded: new Date().toISOString()
        };
        if(!member.name) return showToast('Name required', 'error');
        members.push(member);
        saveData(LS_KEYS.MEMBERS, members);
        loadMembers();
        closeModal('memberModal');
        showToast('Member added', 'success');
        updateStats();
    }

    function loadMembers() {
        const members = getData(LS_KEYS.MEMBERS);
        const tbody = document.getElementById('membersBody');
        if(members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No members yet</td></tr>';
            return;
        }
/* END PART 8 OF 30 - LINE 760 */tbody.innerHTML = members.map(m => `
            <tr>
                <td>${m.name}</td>
                <td><span class="badge badge-cyan">${m.role}</span></td>
                <td>${m.market}</td>
                <td><span class="badge badge-green">${m.status}</span></td>
                <td>
                    <button class="btn btn-ghost" onclick="deleteMember('${m.id}')" style="padding:4px 8px;font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function deleteMember(id) {
        if(!confirm('Delete this member?')) return;
        let members = getData(LS_KEYS.MEMBERS);
        members = members.filter(m => m.id !== id);
        saveData(LS_KEYS.MEMBERS, members);
        loadMembers();
        showToast('Member deleted', 'success');
        updateStats();
    }

    // Seller Functions
    function saveSeller() {
        const sellers = getData(LS_KEYS.SELLERS);
        const arv = parseFloat(document.getElementById('sellerARV').value) || 0;
        const asking = parseFloat(document.getElementById('sellerAsking').value) || 0;
        const repairs = parseFloat(document.getElementById('sellerRepairs').value) || 0;
        const mortgage = parseFloat(document.getElementById('sellerMortgage').value) || 0;
        const equity = asking - mortgage;
        
        const seller = {
            id: generateId(),
            address: document.getElementById('sellerAddress').value,
            arv: arv,
            asking: asking,
            repairs: repairs,
            mortgage: mortgage,
            equity: equity,
            motivation: document.getElementById('sellerMotivation').value,
            notes: document.getElementById('sellerNotes').value,
            dateAdded: new Date().toISOString()
        };
        if(!seller.address) return showToast('Address required', 'error');
        sellers.push(seller);
        saveData(LS_KEYS.SELLERS, sellers);
        loadSellers();
        closeModal('sellerModal');
        showToast('Lead added', 'success');
        logActivity(`New seller lead: ${seller.address}`);
    }

    function loadSellers() {
        const sellers = getData(LS_KEYS.SELLERS);
        const tbody = document.getElementById('sellerBody');
        if(sellers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);">No seller leads yet</td></tr>';
            return;
        }
        tbody.innerHTML = sellers.map(s => `
            <tr>
                <td>${s.address}</td>
                <td>$${s.arv.toLocaleString()}</td>
                <td>$${s.asking.toLocaleString()}</td>
                <td>$${s.equity.toLocaleString()}</td>
                <td><span class="badge ${getMotivationColor(s.motivation)}">${s.motivation.split(' - ')[0]}</span></td>
                <td>
                    <button class="btn btn-ghost" onclick="deleteSeller('${s.id}')" style="padding:4px 8px;font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function getMotivationColor(motivation) {
        if(motivation.includes('Urgent')) return 'badge-pink';
        if(motivation.includes('High')) return 'badge-yellow';
        if(motivation.includes('Medium')) return 'badge-cyan';
        return 'badge-green';
    }

    function deleteSeller(id) {
        if(!confirm('Delete this lead?')) return;
        let sellers = getData(LS_KEYS.SELLERS);
        sellers = sellers.filter(s => s.id !== id);
        saveData(LS_KEYS.SELLERS, sellers);
        loadSellers();
        showToast('Lead deleted', 'success');
    }

    // Contract Functions
    function saveContract() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const contract = {
            id: generateId(),
            address: document.getElementById('contractAddress').value,
            buyer: document.getElementById('contractBuyer').value,
            seller: document.getElementById('contractSeller').value,
/* END PART 9 OF 30 - LINE 855 */price: parseFloat(document.getElementById('contractPrice').value) || 0,
            fee: parseFloat(document.getElementById('contractFee').value) || 0,
            emd: parseFloat(document.getElementById('contractEMD').value) || 0,
            closing: document.getElementById('contractClosing').value,
            status: document.getElementById('contractStatus').value,
            notes: document.getElementById('contractNotes').value,
            dateAdded: new Date().toISOString()
        };
        if(!contract.address) return showToast('Address required', 'error');
        contracts.push(contract);
        saveData(LS_KEYS.CONTRACTS, contracts);
        loadContracts();
        closeModal('contractModal');
        showToast('Contract saved', 'success');
        logActivity(`New contract: ${contract.address} - $${contract.price.toLocaleString()}`);
        updateStats();
    }

    function loadContracts() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const tbody = document.getElementById('contractBody');
        if(contracts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);">No contracts yet</td></tr>';
            return;
        }
        tbody.innerHTML = contracts.map(c => `
            <tr>
                <td>${c.address}</td>
                <td>${c.buyer}</td>
                <td>${c.seller}</td>
                <td>$${c.price.toLocaleString()}</td>
                <td>$${c.fee.toLocaleString()}</td>
                <td>${c.closing || 'TBD'}</td>
                <td><span class="badge ${getStatusColor(c.status)}">${c.status}</span></td>
                <td>
                    <button class="btn btn-ghost" onclick="deleteContract('${c.id}')" style="padding:4px 8px;font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function getStatusColor(status) {
        if(status === 'Closed') return 'badge-green';
        if(status === 'Terminated') return 'badge-pink';
        if(status === 'Closing Scheduled') return 'badge-yellow';
        return 'badge-cyan';
    }

    function deleteContract(id) {
        if(!confirm('Delete this contract?')) return;
        let contracts = getData(LS_KEYS.CONTRACTS);
        contracts = contracts.filter(c => c.id !== id);
        saveData(LS_KEYS.CONTRACTS, contracts);
        loadContracts();
        showToast('Contract deleted', 'success');
        updateStats();
    }

    // Comps Functions
    function addComp() {
        const address = document.getElementById('compAddress').value;
        const beds = document.getElementById('compBeds').value;
        const sqft = parseFloat(document.getElementById('compSqft').value) || 0;
        if(!address) return showToast('Address required', 'error');
        
        document.getElementById('compModal').classList.add('active');
    }

    function saveComp() {
        const comps = getData(LS_KEYS.COMPS);
        const comp = {
            id: generateId(),
            address: document.getElementById('compAddress').value,
            beds: document.getElementById('compBeds').value,
            sqft: parseFloat(document.getElementById('compSqft').value) || 0,
            price: parseFloat(document.getElementById('compPrice').value) || 0,
            date: document.getElementById('compDate').value,
            notes: document.getElementById('compNotes').value,
            ppsqft: 0
        };
        comp.ppsqft = comp.sqft > 0 ? Math.round(comp.price / comp.sqft) : 0;
        comps.push(comp);
        saveData(LS_KEYS.COMPS, comps);
        loadComps();
        closeModal('compModal');
        clearCompInputs();
        showToast('Comp added', 'success');
    }

    function loadComps() {
        const comps = getData(LS_KEYS.COMPS);
        const tbody = document.getElementById('compsBody');
/* END PART 10 OF 30 - LINE 950 */if(comps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);">No comps added yet</td></tr>';
            return;
        }
        tbody.innerHTML = comps.map(c => `
            <tr>
                <td>${c.address}</td>
                <td>${c.beds}</td>
                <td>${c.sqft.toLocaleString()}</td>
                <td>$${c.price.toLocaleString()}</td>
                <td>$${c.ppsqft}</td>
                <td>${c.date || 'N/A'}</td>
                <td>
                    <button class="btn btn-ghost" onclick="deleteComp('${c.id}')" style="padding:4px 8px;font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function deleteComp(id) {
        if(!confirm('Delete this comp?')) return;
        let comps = getData(LS_KEYS.COMPS);
        comps = comps.filter(c => c.id !== id);
        saveData(LS_KEYS.COMPS, comps);
        loadComps();
        showToast('Comp deleted', 'success');
    }

    function clearCompInputs() {
        document.getElementById('compAddress').value = '';
        document.getElementById('compBeds').value = '';
        document.getElementById('compSqft').value = '';
        document.getElementById('compPrice').value = '';
        document.getElementById('compDate').value = '';
        document.getElementById('compNotes').value = '';
    }

    // Message Functions
    const TEMPLATES = {
        cold_seller: `Hey {name}, I saw your property at {address} and wanted to reach out. I'm a local cash buyer and can close quickly with no fees or commissions. Would you be open to a cash offer?`,
        buyer_match: `Hey {name}, I just locked up a deal at {address} that matches your buy box. ARV ${arv}, asking ${price}. You interested in details?`,
        follow_up: `Hey {name}, just following up on {address}. Still looking to sell? I can make you a fair cash offer and close on your timeline.`,
        closing_push: `Hey {name}, we're getting close to closing on {address}. Just need to confirm we're still good for {date}. Let me know if you need anything from my end.`
    };

    function loadTemplate() {
        const key = document.getElementById('templateSelect').value;
        document.getElementById('messageTemplate').value = TEMPLATES[key] || '';
    }

    function copyMessage() {
        const text = document.getElementById('messageTemplate').value;
        if(!text) return showToast('Nothing to copy', 'error');
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
    }

    function sendMessage() {
        const text = document.getElementById('messageTemplate').value;
        if(!text) return showToast('Message empty', 'error');
        const messages = getData(LS_KEYS.MESSAGES);
        messages.unshift({
            id: generateId(),
            text: text,
            timestamp: new Date().toISOString()
        });
        saveData(LS_KEYS.MESSAGES, messages.slice(0, 50));
        loadMessages();
        document.getElementById('messageTemplate').value = '';
        showToast('Message logged', 'success');
    }

    function loadMessages() {
        const messages = getData(LS_KEYS.MESSAGES);
        const log = document.getElementById('messageLog');
        if(messages.length === 0) {
            log.innerHTML = '<p style="color: var(--muted);">No messages sent yet</p>';
            return;
        }
        log.innerHTML = messages.map(m => `
            <div class="card" style="margin-bottom:10px;padding:10px;">
                <div style="font-size:12px;color:var(--muted);margin-bottom:5px;">${new Date(m.timestamp).toLocaleString()}</div>
                <div style="font-size:14px;">${m.text}</div>
            </div>
        `).join('');
    }

    // Vaultforge Analyzer
    function runVaultforge() {
        const purchase = parseFloat(document.getElementById('vfPurchase').value) || 0;
        const arv = parseFloat(document.getElementById('vfARV').value) || 0;
        const repairs = parseFloat(document.getElementById('vfRepairs').value) || 0;
        const fee = parseFloat(document.getElementById('vfFee').value) || 0;
        
        const totalCost = purchase + repairs + fee;
        const profit = arv - totalCost;
        const roi = purchase > 0 ? ((profit / purchase) * 100).toFixed(1) : 0;
        const mao70 = (arv * 0.7) - repairs;
/* END PART 11 OF 30 - LINE 1045 */const results = document.getElementById('vfResults');
        results.innerHTML = `
            <div class="stat-box">
                <div class="stat-number">$${profit.toLocaleString()}</div>
                <div class="stat-label">Potential Profit</div>
            </div>
            <div class="stat-box" style="margin-top:10px;">
                <div class="stat-number">${roi}%</div>
                <div class="stat-label">ROI</div>
            </div>
            <div class="stat-box" style="margin-top:10px;">
                <div class="stat-number">$${mao70.toLocaleString()}</div>
                <div class="stat-label">MAO 70% Rule</div>
            </div>
        `;
    }

    function calcMAO() {
        const arv = parseFloat(document.getElementById('maoARV').value) || 0;
        const repairs = parseFloat(document.getElementById('maoRepairs').value) || 0;
        const profit = parseFloat(document.getElementById('maoProfit').value) || 0;
        const formula = parseFloat(document.getElementById('maoFormula').value) || 0.7;
        const mao = (arv * formula) - repairs - profit;
        document.getElementById('maoResult').textContent = `$${Math.max(0, mao).toLocaleString()}`;
    }

    // Stats Functions
    function updateStats() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const sellers = getData(LS_KEYS.SELLERS);
        const members = getData(LS_KEYS.MEMBERS);
        
        const activeDeals = contracts.filter(c => c.status !== 'Closed' && c.status !== 'Terminated').length;
        const totalRevenue = contracts.filter(c => c.status === 'Closed').reduce((sum, c) => sum + c.fee, 0);
        const activeSellers = sellers.length;
        const totalMembers = members.length;
        
        document.getElementById('statActiveDeals').textContent = activeDeals;
        document.getElementById('statRevenue').textContent = `$${totalRevenue.toLocaleString()}`;
        document.getElementById('statSellers').textContent = activeSellers;
        document.getElementById('statMembers').textContent = totalMembers;
    }

    // Activity Log
    function logActivity(text) {
        const activities = getData('vf_activities') || [];
        activities.unshift({
            id: generateId(),
            text: text,
            timestamp: new Date().toISOString()
        });
        saveData('vf_activities', activities.slice(0, 20));
        loadActivity();
    }

    function loadActivity() {
        const activities = getData('vf_activities') || [];
        const feed = document.getElementById('activityFeed');
        if(activities.length === 0) {
            feed.innerHTML = '<div class="feed-item">No activity yet</div>';
            return;
        }
        feed.innerHTML = activities.map(a => `
            <div class="feed-item">
                <div class="feed-time">${new Date(a.timestamp).toLocaleString()}</div>
                <div>${a.text}</div>
            </div>
        `).join('');
    }

    // Toast System
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
/* END PART 12 OF 30 - LINE 1140 */    // Export/Import System
    function exportData() {
        const data = {
            members: getData(LS_KEYS.MEMBERS),
            sellers: getData(LS_KEYS.SELLERS),
            contracts: getData(LS_KEYS.CONTRACTS),
            comps: getData(LS_KEYS.COMPS),
            messages: getData(LS_KEYS.MESSAGES),
            profile: getData(LS_KEYS.PROFILE),
            activities: getData('vf_activities'),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vaultforge-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showToast('Data exported', 'success');
    }

    function importData(event) {
        const file = event.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if(data.members) saveData(LS_KEYS.MEMBERS, data.members);
                if(data.sellers) saveData(LS_KEYS.SELLERS, data.sellers);
                if(data.contracts) saveData(LS_KEYS.CONTRACTS, data.contracts);
                if(data.comps) saveData(LS_KEYS.COMPS, data.comps);
                if(data.messages) saveData(LS_KEYS.MESSAGES, data.messages);
                if(data.profile) saveData(LS_KEYS.PROFILE, data.profile);
                if(data.activities) saveData('vf_activities', data.activities);
                showToast('Data imported successfully', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch(err) {
                showToast('Import failed: Invalid file', 'error');
            }
        };
        reader.readAsText(file);
    }

    function backupToCloud() {
        showToast('Cloud backup coming soon', 'info');
    }

    // CSV Export Functions
    function exportMembersCSV() {
        const members = getData(LS_KEYS.MEMBERS);
        const csv = [
            ['Name', 'Role', 'Market', 'Email', 'Phone', 'Status', 'Date Added'].join(','),
           ...members.map(m => [
                m.name, m.role, m.market, m.email, m.phone, m.status, m.dateAdded
            ].map(v => `"${v}"`).join(','))
        ].join('\n');
        downloadCSV(csv, 'members.csv');
    }

    function exportSellersCSV() {
        const sellers = getData(LS_KEYS.SELLERS);
        const csv = [
            ['Address', 'ARV', 'Asking', 'Repairs', 'Mortgage', 'Equity', 'Motivation', 'Date Added'].join(','),
           ...sellers.map(s => [
                s.address, s.arv, s.asking, s.repairs, s.mortgage, s.equity, s.motivation, s.dateAdded
            ].map(v => `"${v}"`).join(','))
        ].join('\n');
        downloadCSV(csv, 'sellers.csv');
    }

    function exportContractsCSV() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const csv = [
            ['Address', 'Buyer', 'Seller', 'Price', 'Fee', 'EMD', 'Closing', 'Status', 'Date Added'].join(','),
           ...contracts.map(c => [
                c.address, c.buyer, c.seller, c.price, c.fee, c.emd, c.closing, c.status, c.dateAdded
            ].map(v => `"${v}"`).join(','))
        ].join('\n');
        downloadCSV(csv, 'contracts.csv');
    }

    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        showToast(`Exported ${filename}`, 'success');
    }

    // Init Function
    function initApp() {
/* END PART 13 OF 30 - LINE 1235 */loadProfile();
        loadMembers();
        loadSellers();
        loadContracts();
        loadComps();
        loadMessages();
        loadActivity();
        updateStats();
        loadTemplate();
        initCharts();
        logActivity('App initialized');
    }

    // Search Functions
    function searchMembers() {
        const query = document.getElementById('memberSearch').value.toLowerCase();
        const members = getData(LS_KEYS.MEMBERS);
        const filtered = members.filter(m => 
            m.name.toLowerCase().includes(query) || 
            m.role.toLowerCase().includes(query) || 
            m.market.toLowerCase().includes(query)
        );
        const tbody = document.getElementById('membersBody');
        tbody.innerHTML = filtered.map(m => `
            <tr>
                <td>${m.name}</td>
                <td><span class="badge badge-cyan">${m.role}</span></td>
                <td>${m.market}</td>
                <td><span class="badge badge-green">${m.status}</span></td>
                <td>
                    <button class="btn btn-ghost" onclick="deleteMember('${m.id}')" style="padding:4px 8px;font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function searchSellers() {
        const query = document.getElementById('sellerSearch').value.toLowerCase();
        const sellers = getData(LS_KEYS.SELLERS);
        const filtered = sellers.filter(s => 
            s.address.toLowerCase().includes(query) || 
            s.motivation.toLowerCase().includes(query)
        );
        const tbody = document.getElementById('sellerBody');
        tbody.innerHTML = filtered.map(s => `
            <tr>
                <td>${s.address}</td>
                <td>$${s.arv.toLocaleString()}</td>
                <td>$${s.asking.toLocaleString()}</td>
                <td>$${s.equity.toLocaleString()}</td>
                <td><span class="badge ${getMotivationColor(s.motivation)}">${s.motivation.split(' - ')[0]}</span></td>
                <td>
                    <button class="btn btn-ghost" onclick="deleteSeller('${s.id}')" style="padding:4px 8px;font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // Chart Functions
    let revenueChart;
    function initCharts() {
        const ctx = document.getElementById('revenueChart');
        if(!ctx) return;
        
        const contracts = getData(LS_KEYS.CONTRACTS).filter(c => c.status === 'Closed');
        const monthlyData = {};
        
        contracts.forEach(c => {
            const month = new Date(c.closing || c.dateAdded).toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
            monthlyData[month] = (monthlyData[month] || 0) + c.fee;
        });
        
        const labels = Object.keys(monthlyData).slice(-6);
        const data = labels.map(l => monthlyData[l]);
        
        if(revenueChart) revenueChart.destroy();
        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: data,
                    borderColor: '#00f5ff',
                    backgroundColor: 'rgba(0, 245, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
/* END PART 14 OF 30 - LINE 1330 */// Pipeline Functions
    function updatePipeline() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const stages = {
            'Under Contract': [],
            'Title Ordered': [],
            'Closing Scheduled': [],
            'Closed': []
        };
        
        contracts.forEach(c => {
            if(stages[c.status]) stages[c.status].push(c);
        });
        
        Object.keys(stages).forEach(stage => {
            const el = document.getElementById(`pipeline-${stage.replace(/\s/g, '')}`);
            if(el) {
                el.innerHTML = stages[stage].map(c => `
                    <div class="pipeline-card" onclick="viewContract('${c.id}')">
                        <div style="font-weight:600;margin-bottom:4px;">${c.address}</div>
                        <div style="font-size:12px;color:var(--muted);">$${c.price.toLocaleString()} | Fee: $${c.fee.toLocaleString()}</div>
                    </div>
                `).join('') || '<div style="color:var(--muted);font-size:14px;">No deals</div>';
            }
        });
    }

    function viewContract(id) {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const contract = contracts.find(c => c.id === id);
        if(contract) {
            alert(`Contract Details:\n\nAddress: ${contract.address}\nBuyer: ${contract.buyer}\nSeller: ${contract.seller}\nPrice: $${contract.price.toLocaleString()}\nFee: $${contract.fee.toLocaleString()}\nStatus: ${contract.status}\nClosing: ${contract.closing || 'TBD'}`);
        }
    }

    // Calculator Helpers
    function formatCurrency(num) {
        return '$' + parseFloat(num || 0).toLocaleString();
    }

    function formatPercent(num) {
        return parseFloat(num || 0).toFixed(1) + '%';
    }

    function calcROI(profit, investment) {
        if(investment === 0) return 0;
        return ((profit / investment) * 100).toFixed(1);
    }

    // Date Utilities
    function formatDate(dateStr) {
        if(!dateStr) return 'TBD';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
    }

    function daysUntil(dateStr) {
        if(!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        return diff;
    }

    function isOverdue(dateStr) {
        const days = daysUntil(dateStr);
        return days !== null && days < 0;
    }

    // Validation Functions
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        return /^[\d\s\-\(\)\+]+$/.test(phone);
    }

    function validateRequired(value, fieldName) {
        if(!value || value.trim() === '') {
            showToast(`${fieldName} is required`, 'error');
            return false;
        }
        return true;
    }

    function validateNumber(value, fieldName) {
        const num = parseFloat(value);
        if(isNaN(num) || num < 0) {
            showToast(`${fieldName} must be a valid positive number`, 'error');
            return false;
        }
        return true;
    }
/* END PART 15 OF 30 - LINE 1425 */// Pipeline Functions
    function updatePipeline() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const stages = {
            'Under Contract': [],
            'Title Ordered': [],
            'Closing Scheduled': [],
            'Closed': []
        };
        
        contracts.forEach(c => {
            if(stages[c.status]) stages[c.status].push(c);
        });
        
        Object.keys(stages).forEach(stage => {
            const el = document.getElementById(`pipeline-${stage.replace(/\s/g, '')}`);
            if(el) {
                el.innerHTML = stages[stage].map(c => `
                    <div class="pipeline-card" onclick="viewContract('${c.id}')">
                        <div style="font-weight:600;margin-bottom:4px;">${c.address}</div>
                        <div style="font-size:12px;color:var(--muted);">$${c.price.toLocaleString()} | Fee: $${c.fee.toLocaleString()}</div>
                    </div>
                `).join('') || '<div style="color:var(--muted);font-size:14px;">No deals</div>';
            }
        });
    }

    function viewContract(id) {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const contract = contracts.find(c => c.id === id);
        if(contract) {
            alert(`Contract Details:\n\nAddress: ${contract.address}\nBuyer: ${contract.buyer}\nSeller: ${contract.seller}\nPrice: $${contract.price.toLocaleString()}\nFee: $${contract.fee.toLocaleString()}\nStatus: ${contract.status}\nClosing: ${contract.closing || 'TBD'}`);
        }
    }

    // Calculator Helpers
    function formatCurrency(num) {
        return '$' + parseFloat(num || 0).toLocaleString();
    }

    function formatPercent(num) {
        return parseFloat(num || 0).toFixed(1) + '%';
    }

    function calcROI(profit, investment) {
        if(investment === 0) return 0;
        return ((profit / investment) * 100).toFixed(1);
    }

    // Date Utilities
    function formatDate(dateStr) {
        if(!dateStr) return 'TBD';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
    }

    function daysUntil(dateStr) {
        if(!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        return diff;
    }

    function isOverdue(dateStr) {
        const days = daysUntil(dateStr);
        return days !== null && days < 0;
    }

    // Validation Functions
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        return /^[\d\s\-\(\)\+]+$/.test(phone);
    }

    function validateRequired(value, fieldName) {
        if(!value || value.trim() === '') {
            showToast(`${fieldName} is required`, 'error');
            return false;
        }
        return true;
    }

    function validateNumber(value, fieldName) {
        const num = parseFloat(value);
        if(isNaN(num) || num < 0) {
            showToast(`${fieldName} must be a valid positive number`, 'error');
            return false;
        }
        return true;
    }
/* END PART 15 OF 30 - LINE 1425 */// Advanced Deal Analyzer
    function analyzeDeal() {
        const address = document.getElementById('analyzeAddress').value;
        const arv = parseFloat(document.getElementById('analyzeARV').value) || 0;
        const asking = parseFloat(document.getElementById('analyzeAsking').value) || 0;
        const repairs = parseFloat(document.getElementById('analyzeRepairs').value) || 0;
        const holding = parseFloat(document.getElementById('analyzeHolding').value) || 0;
        const closing = parseFloat(document.getElementById('analyzeClosing').value) || 0;
        const wholesale = parseFloat(document.getElementById('analyzeWholesale').value) || 0;
        
        if(!validateRequired(address, 'Address')) return;
        if(!validateNumber(arv, 'ARV')) return;
        
        const totalCost = asking + repairs + holding + closing + wholesale;
        const profit = arv - totalCost;
        const roi = calcROI(profit, asking);
        const mao65 = (arv * 0.65) - repairs;
        const mao70 = (arv * 0.7) - repairs;
        const mao75 = (arv * 0.75) - repairs;
        
        const resultDiv = document.getElementById('analyzeResults');
        resultDiv.innerHTML = `
            <div class="card">
                <h4 style="color:var(--cyan);margin-bottom:15px;">Deal Analysis: ${address}</h4>
                <div class="grid grid-2" style="gap:15px;">
                    <div class="stat-box">
                        <div class="stat-number ${profit > 0 ? 'text-green' : 'text-pink'}">$${profit.toLocaleString()}</div>
                        <div class="stat-label">Potential Profit</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${roi}%</div>
                        <div class="stat-label">ROI</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">$${mao65.toLocaleString()}</div>
                        <div class="stat-label">MAO 65%</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">$${mao70.toLocaleString()}</div>
                        <div class="stat-label">MAO 70%</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">$${mao75.toLocaleString()}</div>
                        <div class="stat-label">MAO 75%</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">$${totalCost.toLocaleString()}</div>
                        <div class="stat-label">Total Cost</div>
                    </div>
                </div>
                <div style="margin-top:15px;padding:10px;background:rgba(0,245,255,0.1);border-radius:8px;">
                    <strong>Recommendation:</strong> ${profit > 20000 ? 'Strong deal - Move forward' : profit > 10000 ? 'Decent deal - Negotiate' : 'Marginal - Pass or renegotiate'}
                </div>
            </div>
        `;
    }

    // Market Comps Analysis
    function analyzeComps() {
        const comps = getData(LS_KEYS.COMPS);
        if(comps.length === 0) {
            showToast('Add comps first', 'error');
            return;
        }
        
        const avgPrice = comps.reduce((sum, c) => sum + c.price, 0) / comps.length;
        const avgSqft = comps.reduce((sum, c) => sum + c.sqft, 0) / comps.length;
        const avgPPSQFT = comps.reduce((sum, c) => sum + c.ppsqft, 0) / comps.length;
        
        const analysisDiv = document.getElementById('compsAnalysis');
        analysisDiv.innerHTML = `
            <div class="card">
                <h4 style="color:var(--cyan);margin-bottom:15px;">Market Analysis</h4>
                <div class="grid grid-3" style="gap:15px;">
                    <div class="stat-box">
                        <div class="stat-number">$${Math.round(avgPrice).toLocaleString()}</div>
                        <div class="stat-label">Avg Sale Price</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${Math.round(avgSqft).toLocaleString()}</div>
                        <div class="stat-label">Avg Sqft</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">$${Math.round(avgPPSQFT)}</div>
                        <div class="stat-label">Avg $/Sqft</div>
                    </div>
                </div>
            </div>
        `;
    }
/* END PART 17 OF 30 - LINE 1615 */// Equity Calculator
    function calcEquity() {
        const arv = parseFloat(document.getElementById('equityARV').value) || 0;
        const mortgage = parseFloat(document.getElementById('equityMortgage').value) || 0;
        const liens = parseFloat(document.getElementById('equityLiens').value) || 0;
        const equity = arv - mortgage - liens;
        const equityPercent = arv > 0? ((equity / arv) * 100).toFixed(1) : 0;
        
        document.getElementById('equityResult').innerHTML = `
            <div class="stat-box">
                <div class="stat-number">$${equity.toLocaleString()}</div>
                <div class="stat-label">Total Equity (${equityPercent}%)</div>
            </div>
        `;
    }

    // Repair Estimator
    const REPAIR_COSTS = {
        roof: 8000,
        kitchen: 15000,
        bathroom: 8000,
        flooring: 5000,
        paint: 3000,
        hvac: 6000,
        electrical: 4000,
        plumbing: 3500,
        foundation: 12000,
        windows: 6000
    };

    function estimateRepairs() {
        const checks = document.querySelectorAll('#repairForm input[type="checkbox"]:checked');
        let total = 0;
        const items = [];
        
        checks.forEach(cb => {
            const cost = REPAIR_COSTS[cb.value] || 0;
            total += cost;
            items.push(`${cb.value}: $${cost.toLocaleString()}`);
        });
        
        const customCost = parseFloat(document.getElementById('repairCustom').value) || 0;
        total += customCost;
        if(customCost > 0) items.push(`Custom: $${customCost.toLocaleString()}`);
        
        document.getElementById('repairEstimate').innerHTML = `
            <div class="card">
                <h4 style="color:var(--cyan);margin-bottom:10px;">Estimated Repairs</h4>
                <div style="margin-bottom:10px;">${items.join('<br>') || 'No items selected'}</div>
                <div class="stat-box">
                    <div class="stat-number">$${total.toLocaleString()}</div>
                    <div class="stat-label">Total Estimate</div>
                </div>
            </div>
        `;
    }

    // Motivated Seller Script Generator
    function generateSellerScript() {
        const situation = document.getElementById('sellerSituation').value;
        const scripts = {
            foreclosure: `I understand you're facing foreclosure and that can be really stressful. I work with homeowners in similar situations and can close quickly, often in 7-14 days. This would stop the foreclosure process and let you walk away with cash instead of losing everything. Would you be open to discussing a cash offer?`,
            divorce: `I know divorce can complicate property decisions. I specialize in helping couples sell quickly and split proceeds fairly without the hassle of listings, showings, or repairs. We can close on your timeline. Can I make you a no-obligation cash offer?`,
            inherited: `Sorry for your loss. Dealing with an inherited property can be overwhelming, especially if it's out of state or needs work. I buy houses as-is and handle all the paperwork. Would a quick cash sale help you move forward?`,
            tired_landlord: `I hear you - being a landlord isn't always easy. I buy rental properties with tenants or vacant, as-is. No need to make repairs or deal with evictions. Would you consider a cash offer that lets you cash out and move on?`,
            relocation: `Relocating is stressful enough without worrying about selling a house. I can buy your property quickly so you can focus on your move. No showings, no repairs, no commissions. Should we talk numbers?`
        };
        document.getElementById('sellerScriptOutput').value = scripts[situation] || '';
    }

    // Dispo List Builder
    function addToDispoList() {
        const buyer = {
            id: generateId(),
            name: document.getElementById('dispoName').value,
            email: document.getElementById('dispoEmail').value,
            phone: document.getElementById('dispoPhone').value,
            buybox: document.getElementById('dispoBuybox').value,
            budget: parseFloat(document.getElementById('dispoBudget').value) || 0
        };
        if(!validateRequired(buyer.name, 'Name')) return;
        const list = getData('vf_dispo') || [];
        list.push(buyer);
        saveData('vf_dispo', list);
        loadDispoList();
        showToast('Buyer added to dispo list', 'success');
    }
/* END PART 18 OF 30 - LINE 1710 */// Equity Calculator
    function calcEquity() {
        const arv = parseFloat(document.getElementById('equityARV').value) || 0;
        const mortgage = parseFloat(document.getElementById('equityMortgage').value) || 0;
        const liens = parseFloat(document.getElementById('equityLiens').value) || 0;
        const equity = arv - mortgage - liens;
        const equityPercent = arv > 0? ((equity / arv) * 100).toFixed(1) : 0;
        
        document.getElementById('equityResult').innerHTML = `
            <div class="stat-box">
                <div class="stat-number">$${equity.toLocaleString()}</div>
                <div class="stat-label">Total Equity (${equityPercent}%)</div>
            </div>
        `;
    }

    // Repair Estimator
    const REPAIR_COSTS = {
        roof: 8000,
        kitchen: 15000,
        bathroom: 8000,
        flooring: 5000,
        paint: 3000,
        hvac: 6000,
        electrical: 4000,
        plumbing: 3500,
        foundation: 12000,
        windows: 6000
    };

    function estimateRepairs() {
        const checks = document.querySelectorAll('#repairForm input[type="checkbox"]:checked');
        let total = 0;
        const items = [];
        
        checks.forEach(cb => {
            const cost = REPAIR_COSTS[cb.value] || 0;
            total += cost;
            items.push(`${cb.value}: $${cost.toLocaleString()}`);
        });
        
        const customCost = parseFloat(document.getElementById('repairCustom').value) || 0;
        total += customCost;
        if(customCost > 0) items.push(`Custom: $${customCost.toLocaleString()}`);
        
        document.getElementById('repairEstimate').innerHTML = `
            <div class="card">
                <h4 style="color:var(--cyan);margin-bottom:10px;">Estimated Repairs</h4>
                <div style="margin-bottom:10px;">${items.join('<br>') || 'No items selected'}</div>
                <div class="stat-box">
                    <div class="stat-number">$${total.toLocaleString()}</div>
                    <div class="stat-label">Total Estimate</div>
                </div>
            </div>
        `;
    }

    // Motivated Seller Script Generator
    function generateSellerScript() {
        const situation = document.getElementById('sellerSituation').value;
        const scripts = {
            foreclosure: `I understand you're facing foreclosure and that can be really stressful. I work with homeowners in similar situations and can close quickly, often in 7-14 days. This would stop the foreclosure process and let you walk away with cash instead of losing everything. Would you be open to discussing a cash offer?`,
            divorce: `I know divorce can complicate property decisions. I specialize in helping couples sell quickly and split proceeds fairly without the hassle of listings, showings, or repairs. We can close on your timeline. Can I make you a no-obligation cash offer?`,
            inherited: `Sorry for your loss. Dealing with an inherited property can be overwhelming, especially if it's out of state or needs work. I buy houses as-is and handle all the paperwork. Would a quick cash sale help you move forward?`,
            tired_landlord: `I hear you - being a landlord isn't always easy. I buy rental properties with tenants or vacant, as-is. No need to make repairs or deal with evictions. Would you consider a cash offer that lets you cash out and move on?`,
            relocation: `Relocating is stressful enough without worrying about selling a house. I can buy your property quickly so you can focus on your move. No showings, no repairs, no commissions. Should we talk numbers?`
        };
        document.getElementById('sellerScriptOutput').value = scripts[situation] || '';
    }

    // Dispo List Builder
    function addToDispoList() {
        const buyer = {
            id: generateId(),
            name: document.getElementById('dispoName').value,
            email: document.getElementById('dispoEmail').value,
            phone: document.getElementById('dispoPhone').value,
            buybox: document.getElementById('dispoBuybox').value,
            budget: parseFloat(document.getElementById('dispoBudget').value) || 0
        };
        if(!validateRequired(buyer.name, 'Name')) return;
        const list = getData('vf_dispo') || [];
        list.push(buyer);
        saveData('vf_dispo', list);
        loadDispoList();
        showToast('Buyer added to dispo list', 'success');
    }
/* END PART 18 OF 30 - LINE 1710 */// Closing Calendar
    function loadClosingCalendar() {
        const contracts = getData(LS_KEYS.CONTRACTS).filter(c => c.closing && c.status!== 'Closed' && c.status!== 'Terminated');
        const calendar = document.getElementById('closingCalendar');
        if(!calendar) return;
        
        if(contracts.length === 0) {
            calendar.innerHTML = '<div style="color:var(--muted);text-align:center;">No upcoming closings</div>';
            return;
        }
        
        const sorted = contracts.sort((a, b) => new Date(a.closing) - new Date(b.closing));
        calendar.innerHTML = sorted.map(c => {
            const days = daysUntil(c.closing);
            const urgent = days <= 7;
            return `
                <div class="card" style="margin-bottom:10px;border-left:3px solid ${urgent? 'var(--pink)' : 'var(--cyan)'};">
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <div>
                            <div style="font-weight:600;">${c.address}</div>
                            <div style="font-size:12px;color:var(--muted);margin-top:4px;">
                                ${formatDate(c.closing)} • ${days >= 0? days + ' days' : 'Overdue'}
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:600;color:var(--green);">$${c.fee.toLocaleString()}</div>
                            <div style="font-size:11px;color:var(--muted);">Fee</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Document Checklist
    const DOC_CHECKLIST = [
        'Purchase Agreement',
        'Assignment Contract',
        'EMD Receipt',
        'Title Commitment',
        'HUD Statement',
        'Deed',
        'Bill of Sale',
        'Closing Disclosure'
    ];

    function loadDocChecklist(contractId) {
        const checklist = getData('vf_checklist_' + contractId) || {};
        const container = document.getElementById('docChecklist');
        if(!container) return;
        
        container.innerHTML = DOC_CHECKLIST.map(doc => `
            <label style="display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer;">
                <input type="checkbox" ${checklist[doc]? 'checked' : ''} onchange="toggleDoc('${contractId}', '${doc}', this.checked)">
                <span>${doc}</span>
            </label>
        `).join('');
    }

    function toggleDoc(contractId, doc, checked) {
        const checklist = getData('vf_checklist_' + contractId) || {};
        checklist[doc] = checked;
        saveData('vf_checklist_' + contractId, checklist);
    }

    // Due Diligence Tracker
    function startDiligence(contractId) {
        const diligence = {
            contractId: contractId,
            startDate: new Date().toISOString(),
            inspectionDone: false,
            appraisalDone: false,
            titleDone: false,
            notes: ''
        };
        saveData('vf_diligence_' + contractId, diligence);
        showToast('Diligence period started', 'success');
    }

    function updateDiligence(contractId, field, value) {
        const diligence = getData('vf_diligence_' + contractId) || {};
        diligence[field] = value;
        saveData('vf_diligence_' + contractId, diligence);
    }

    // Title Company Contacts
    function saveTitleCompany() {
        const company = {
            id: generateId(),
            name: document.getElementById('titleName').value,
            contact: document.getElementById('titleContact').value,
            phone: document.getElementById('titlePhone').value,
            email: document.getElementById('titleEmail').value,
            notes: document.getElementById('titleNotes').value
        };
        if(!validateRequired(company.name, 'Company Name')) return;
        const companies = getData('vf_title_companies') || [];
        companies.push(company);
        saveData('vf_title_companies', companies);
        loadTitleCompanies();
        showToast('Title company saved', 'success');
    }

    function loadTitleCompanies() {
        const companies = getData('vf_title_companies') || [];
        const list = document.getElementById('titleList');
        if(!list) return;
        list.innerHTML = companies.map(c => `
            <div class="card" style="margin-bottom:10px;">
                <div style="font-weight:600;">${c.name}</div>
                <div style="font-size:12px;color:var(--muted);margin-top:4px;">
                    ${c.contact}<br>${c.phone}<br>${c.email}
                </div>
            </div>
        `).join('');
    }
/* END PART 20 OF 30 - LINE 1900 */// Marketing Tools
    const SMS_TEMPLATES = {
        first_touch: "Hi {name}, I buy houses in {city} for cash. Would you consider a cash offer on {address}? No fees, no repairs needed.",
        follow_up_1: "Hey {name}, just circling back on {address}. Still looking to sell? I can close in 7 days.",
        follow_up_2: "Hi {name}, I'm still interested in {address}. Can we schedule 10 min to discuss a cash offer?",
        final_notice: "Last check-in {name} - I'm buying 2 more houses in {city} this month. Is {address} available?"
    };

    function loadSMSTemplate() {
        const key = document.getElementById('smsTemplateSelect').value;
        document.getElementById('smsOutput').value = SMS_TEMPLATES[key] || '';
    }

    function personalizeSMS() {
        let text = document.getElementById('smsOutput').value;
        const name = document.getElementById('smsName').value || '[Name]';
        const address = document.getElementById('smsAddress').value || '[Address]';
        const city = document.getElementById('smsCity').value || '[City]';
        
        text = text.replace(/{name}/g, name).replace(/{address}/g, address).replace(/{city}/g, city);
        document.getElementById('smsOutput').value = text;
    }

    // Email Generator
    function generateEmail() {
        const type = document.getElementById('emailType').value;
        const name = document.getElementById('emailName').value || '[Name]';
        const address = document.getElementById('emailAddress').value || '[Address]';
        
        const emails = {
            seller_intro: `Subject: Cash Offer for ${address}

Hi ${name},

I hope this email finds you well. I'm a local real estate investor and I noticed your property at ${address}.

I specialize in buying houses for cash, as-is, with no repairs needed and no realtor fees. I can close in as little as 7 days on your timeline.

Would you be open to a no-obligation cash offer?

Best regards,
${getData(LS_KEYS.PROFILE).name || 'Vaultforge Acquisitions'}`,
            
            buyer_alert: `Subject: New Deal - ${address}

Hi ${name},

I just locked up a new deal that fits your buy box:

Property: ${address}
Asking: $[Price]
ARV: $[ARV]
Repairs: $[Repairs]

Assignment Fee: $[Fee]

This one will move fast. Are you interested?

Best,
${getData(LS_KEYS.PROFILE).name || 'Vaultforge Acquisitions'}`,
            
            closing_reminder: `Subject: Closing Reminder - ${address}

Hi ${name},

Just a friendly reminder that we're scheduled to close on ${address} on [Date].

Please confirm you have:
- Valid ID
- Funds for closing
- Any required docs

Let me know if you have questions!

Best,
${getData(LS_KEYS.PROFILE).name || 'Vaultforge Acquisitions'}`
        };
        
        document.getElementById('emailOutput').value = emails[type] || '';
    }

    // Lead Scoring
    function scoreLead() {
        const motivation = parseInt(document.getElementById('scoreMotivation').value) || 0;
        const equity = parseFloat(document.getElementById('scoreEquity').value) || 0;
        const timeline = parseInt(document.getElementById('scoreTimeline').value) || 0;
        const condition = parseInt(document.getElementById('scoreCondition').value) || 0;
        
        const equityScore = equity > 50000? 30 : equity > 20000? 20 : 10;
        const totalScore = motivation + equityScore + timeline + condition;
        let rating = 'Cold';
        let color = 'var(--muted)';
        
        if(totalScore >= 80) { rating = 'Hot'; color = 'var(--pink)'; }
        else if(totalScore >= 60) { rating = 'Warm'; color = 'var(--yellow)'; }
        else if(totalScore >= 40) { rating = 'Lukewarm'; color = 'var(--cyan)'; }
        
        document.getElementById('leadScore').innerHTML = `
            <div class="stat-box">
                <div class="stat-number" style="color:${color};">${totalScore}</div>
                <div class="stat-label">${rating} Lead</div>
            </div>
        `;
    }
/* END PART 21 OF 30 - LINE 1995 */ // Follow-up Automation
    function scheduleFollowUp() {
        const followup = {
            id: generateId(),
            leadName: document.getElementById('followupName').value,
            leadPhone: document.getElementById('followupPhone').value,
            leadEmail: document.getElementById('followupEmail').value,
            date: document.getElementById('followupDate').value,
            type: document.getElementById('followupType').value,
            notes: document.getElementById('followupNotes').value,
            completed: false
        };
        if(!validateRequired(followup.leadName, 'Lead Name')) return;
        if(!validateRequired(followup.date, 'Follow-up Date')) return;
        
        const followups = getData('vf_followups') || [];
        followups.push(followup);
        saveData('vf_followups', followups);
        loadFollowUps();
        showToast('Follow-up scheduled', 'success');
    }

    function loadFollowUps() {
        const followups = getData('vf_followups') || [];
        const upcoming = followups.filter(f =>!f.completed && new Date(f.date) >= new Date());
        const container = document.getElementById('followupList');
        if(!container) return;
        
        if(upcoming.length === 0) {
            container.innerHTML = '<div style="color:var(--muted);text-align:center;">No follow-ups scheduled</div>';
            return;
        }
        
        const sorted = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
        container.innerHTML = sorted.map(f => `
            <div class="card" style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div>
                        <div style="font-weight:600;">${f.leadName}</div>
                        <div style="font-size:12px;color:var(--muted);margin-top:4px;">
                            ${f.type} • ${formatDate(f.date)}<br>
                            ${f.leadPhone} ${f.leadEmail? '• ' + f.leadEmail : ''}
                        </div>
                        ${f.notes? `<div style="font-size:12px;margin-top:8px;">${f.notes}</div>` : ''}
                    </div>
                    <button class="btn btn-ghost" onclick="completeFollowUp('${f.id}')" style="padding:4px 8px;font-size:12px;">Done</button>
                </div>
            </div>
        `).join('');
    }

    function completeFollowUp(id) {
        const followups = getData('vf_followups') || [];
        const followup = followups.find(f => f.id === id);
        if(followup) {
            followup.completed = true;
            followup.completedDate = new Date().toISOString();
            saveData('vf_followups', followups);
            loadFollowUps();
            logActivity(`Completed follow-up with ${followup.leadName}`);
            showToast('Follow-up marked complete', 'success');
        }
    }

    // Task Manager
    function addTask() {
        const task = {
            id: generateId(),
            text: document.getElementById('taskText').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDue').value,
            completed: false,
            created: new Date().toISOString()
        };
        if(!validateRequired(task.text, 'Task')) return;
        
        const tasks = getData('vf_tasks') || [];
        tasks.push(task);
        saveData('vf_tasks', tasks);
        loadTasks();
        document.getElementById('taskText').value = '';
        showToast('Task added', 'success');
    }

    function loadTasks() {
        const tasks = getData('vf_tasks') || [];
        const active = tasks.filter(t =>!t.completed);
        const container = document.getElementById('taskList');
        if(!container) return;
        
        if(active.length === 0) {
            container.innerHTML = '<div style="color:var(--muted);text-align:center;">No active tasks</div>';
            return;
        }
        
        const sorted = active.sort((a, b) => {
            const priorityOrder = {high: 0, medium: 1, low: 2};
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        container.innerHTML = sorted.map(t => `
            <div class="card" style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;">
                        <input type="checkbox" onchange="completeTask('${t.id}')">
                        <div>
                            <div>${t.text}</div>
                            <div style="font-size:11px;color:var(--muted);margin-top:4px;">
                                <span class="badge ${t.priority === 'high'? 'badge-pink' : t.priority === 'medium'? 'badge-yellow' : 'badge-cyan'}">${t.priority}</span>
                                ${t.dueDate? ' • Due ' + formatDate(t.dueDate) : ''}
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        `).join('');
    }

    function completeTask(id) {
        const tasks = getData('vf_tasks') || [];
        const task = tasks.find(t => t.id === id);
        if(task) {
            task.completed = true;
            task.completedDate = new Date().toISOString();
            saveData('vf_tasks', tasks);
            loadTasks();
            showToast('Task completed', 'success');
        }
    }
/* END PART 22 OF 30 - LINE 2090 */// Notifications System
    function checkNotifications() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const followups = getData('vf_followups') || [];
        const tasks = getData('vf_tasks') || [];
        const notifications = [];
        
        // Check overdue closings
        contracts.forEach(c => {
            if(c.status !== 'Closed' && c.status!== 'Terminated' && isOverdue(c.closing)) {
                notifications.push({
                    type: 'urgent',
                    message: `Closing overdue: ${c.address}`,
                    icon: '⚠️'
                });
            }
        });
        
        // Check upcoming follow-ups
        const today = new Date();
        followups.forEach(f => {
            if(!f.completed) {
                const followupDate = new Date(f.date);
                const daysDiff = Math.ceil((followupDate - today) / (1000 * 60 * 60 * 24));
                if(daysDiff === 0) {
                    notifications.push({
                        type: 'info',
                        message: `Follow-up today: ${f.leadName}`,
                        icon: '📞'
                    });
                } else if(daysDiff < 0) {
                    notifications.push({
                        type: 'warning',
                        message: `Overdue follow-up: ${f.leadName}`,
                        icon: '⏰'
                    });
                }
            }
        });
        
        // Check overdue tasks
        tasks.forEach(t => {
            if(!t.completed && t.dueDate && isOverdue(t.dueDate)) {
                notifications.push({
                    type: 'warning',
                    message: `Task overdue: ${t.text}`,
                    icon: '📋'
                });
            }
        });
        
        const notifBadge = document.getElementById('notifBadge');
        if(notifBadge) {
            notifBadge.textContent = notifications.length;
            notifBadge.style.display = notifications.length > 0? 'block' : 'none';
        }
        
        return notifications;
    }

    // KPI Dashboard
    function calculateKPIs() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const sellers = getData(LS_KEYS.SELLERS);
        const closed = contracts.filter(c => c.status === 'Closed');
        const active = contracts.filter(c => c.status!== 'Closed' && c.status!== 'Terminated');
        
        const totalRevenue = closed.reduce((sum, c) => sum + c.fee, 0);
        const avgFee = closed.length > 0? totalRevenue / closed.length : 0;
        const avgDaysToClose = closed.length > 0? 
            closed.reduce((sum, c) => {
                const start = new Date(c.dateAdded);
                const end = new Date(c.closing || c.dateAdded);
                return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            }, 0) / closed.length : 0;
        
        const conversionRate = sellers.length > 0? ((contracts.length / sellers.length) * 100).toFixed(1) : 0;
        
        return {
            totalRevenue,
            avgFee,
            avgDaysToClose: Math.round(avgDaysToClose),
            conversionRate,
            activeDeals: active.length,
            closedDeals: closed.length,
            totalLeads: sellers.length
        };
    }

    function updateKPIDashboard() {
        const kpis = calculateKPIs();
        const container = document.getElementById('kpiDashboard');
        if(!container) return;
        
        container.innerHTML = `
            <div class="grid grid-4" style="gap:15px;">
                <div class="stat-box">
                    <div class="stat-number">$${kpis.totalRevenue.toLocaleString()}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">$${Math.round(kpis.avgFee).toLocaleString()}</div>
                    <div class="stat-label">Avg Fee</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${kpis.avgDaysToClose}</div>
                    <div class="stat-label">Avg Days to Close</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${kpis.conversionRate}%</div>
                    <div class="stat-label">Lead Conversion</div>
                </div>
            </div>
        `;
    }

    // Goal Tracker
    function saveGoal() {
        const goal = {
            monthlyRevenue: parseFloat(document.getElementById('goalRevenue').value) || 0,
            monthlyDeals: parseInt(document.getElementById('goalDeals').value) || 0,
            monthlyLeads: parseInt(document.getElementById('goalLeads').value) || 0
        };
        saveData('vf_goals', goal);
        updateGoalProgress();
        showToast('Goals saved', 'success');
    }
/* END PART 23 OF 30 - LINE 2185 */function updateGoalProgress() {
        const goals = getData('vf_goals') || {};
        const contracts = getData(LS_KEYS.CONTRACTS);
        const sellers = getData(LS_KEYS.SELLERS);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const monthlyClosed = contracts.filter(c => {
            const closeDate = new Date(c.closing || c.dateAdded);
            return c.status === 'Closed' && closeDate >= monthStart;
        });
        
        const monthlyRevenue = monthlyClosed.reduce((sum, c) => sum + c.fee, 0);
        const monthlyDeals = monthlyClosed.length;
        const monthlyLeads = sellers.filter(s => new Date(s.dateAdded) >= monthStart).length;
        
        const revenuePercent = goals.monthlyRevenue > 0? Math.min((monthlyRevenue / goals.monthlyRevenue) * 100, 100) : 0;
        const dealsPercent = goals.monthlyDeals > 0? Math.min((monthlyDeals / goals.monthlyDeals) * 100, 100) : 0;
        const leadsPercent = goals.monthlyLeads > 0? Math.min((monthlyLeads / goals.monthlyLeads) * 100, 100) : 0;
        
        const container = document.getElementById('goalProgress');
        if(!container) return;
        
        container.innerHTML = `
            <div style="margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span>Revenue: $${monthlyRevenue.toLocaleString()} / $${(goals.monthlyRevenue || 0).toLocaleString()}</span>
                    <span>${revenuePercent.toFixed(0)}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${revenuePercent}%"></div></div>
            </div>
            <div style="margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span>Deals: ${monthlyDeals} / ${goals.monthlyDeals || 0}</span>
                    <span>${dealsPercent.toFixed(0)}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${dealsPercent}%"></div></div>
            </div>
            <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span>Leads: ${monthlyLeads} / ${goals.monthlyLeads || 0}</span>
                    <span>${leadsPercent.toFixed(0)}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${leadsPercent}%"></div></div>
            </div>
        `;
    }

    // Team Chat
    function sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if(!text) return;
        
        const messages = getData(LS_KEYS.MESSAGES);
        const message = {
            id: generateId(),
            from: getData(LS_KEYS.PROFILE).name || 'You',
            text: text,
            timestamp: new Date().toISOString(),
            read: true
        };
        messages.push(message);
        saveData(LS_KEYS.MESSAGES, messages);
        input.value = '';
        loadMessages();
        logActivity(`Sent message: ${text.substring(0, 30)}...`);
    }

    function loadMessages() {
        const messages = getData(LS_KEYS.MESSAGES);
        const container = document.getElementById('chatMessages');
        if(!container) return;
        
        if(messages.length === 0) {
            container.innerHTML = '<div style="color:var(--muted);text-align:center;">No messages yet</div>';
            return;
        }
        
        container.innerHTML = messages.slice(-20).map(m => `
            <div class="message ${m.from === (getData(LS_KEYS.PROFILE).name || 'You')? 'message-sent' : 'message-received'}">
                <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">${m.from} • ${formatDate(m.timestamp)}</div>
                <div>${m.text}</div>
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }

    // Internal Notes
    function saveNote(context, id) {
        const noteKey = `vf_note_${context}_${id}`;
        const note = document.getElementById(`note-${context}-${id}`).value;
        saveData(noteKey, note);
        showToast('Note saved', 'success');
    }

    function loadNote(context, id) {
        const noteKey = `vf_note_${context}_${id}`;
        const note = getData(noteKey) || '';
        const textarea = document.getElementById(`note-${context}-${id}`);
        if(textarea) textarea.value = note;
    }
/* END PART 24 OF 30 - LINE 2280 */// Activity Feed
    function logActivity(action) {
        const activities = getData('vf_activity') || [];
        const activity = {
            id: generateId(),
            action: action,
            timestamp: new Date().toISOString(),
            user: getData(LS_KEYS.PROFILE).name || 'You'
        };
        activities.unshift(activity);
        if(activities.length > 100) activities.pop();
        saveData('vf_activity', activities);
    }

    function loadActivityFeed() {
        const activities = getData('vf_activity') || [];
        const container = document.getElementById('activityFeed');
        if(!container) return;
        
        if(activities.length === 0) {
            container.innerHTML = '<div style="color:var(--muted);text-align:center;">No recent activity</div>';
            return;
        }
        
        container.innerHTML = activities.slice(0, 20).map(a => `
            <div style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="font-size:13px;">${a.action}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:4px;">${formatDate(a.timestamp)} • ${a.user}</div>
            </div>
        `).join('');
    }

    // Deal Timeline
    function getDealTimeline(contractId) {
        const contract = getData(LS_KEYS.CONTRACTS).find(c => c.id === contractId);
        if(!contract) return [];
        
        const timeline = [
            {date: contract.dateAdded, event: 'Deal Created', status: 'complete'}
        ];
        
        if(contract.emd > 0) {
            timeline.push({date: contract.dateAdded, event: 'EMD Received', status: 'complete'});
        }
        
        if(contract.status === 'Title Ordered' || contract.status === 'Closing Scheduled' || contract.status === 'Closed') {
            timeline.push({date: contract.dateAdded, event: 'Title Ordered', status: 'complete'});
        }
        
        if(contract.status === 'Closing Scheduled' || contract.status === 'Closed') {
            timeline.push({date: contract.closing, event: 'Closing Scheduled', status: 'complete'});
        }
        
        if(contract.status === 'Closed') {
            timeline.push({date: contract.closing, event: 'Deal Closed', status: 'complete'});
        }
        
        return timeline;
    }

    // Audit Log
    function auditLog(action, details) {
        const logs = getData('vf_audit') || [];
        const log = {
            id: generateId(),
            action: action,
            details: details,
            timestamp: new Date().toISOString(),
            user: getData(LS_KEYS.PROFILE).name || 'System'
        };
        logs.unshift(log);
        if(logs.length > 500) logs.pop();
        saveData('vf_audit', logs);
    }

    // Data Integrity
    function validateData() {
        const issues = [];
        const contracts = getData(LS_KEYS.CONTRACTS);
        const sellers = getData(LS_KEYS.SELLERS);
        
        contracts.forEach(c => {
            if(!c.address) issues.push(`Contract ${c.id} missing address`);
            if(!c.price || c.price <= 0) issues.push(`Contract ${c.id} invalid price`);
            if(!c.fee || c.fee < 0) issues.push(`Contract ${c.id} invalid fee`);
        });
        
        sellers.forEach(s => {
            if(!s.address) issues.push(`Seller ${s.id} missing address`);
            if(!s.arv || s.arv <= 0) issues.push(`Seller ${s.id} invalid ARV`);
        });
        
        if(issues.length > 0) {
            console.warn('Data integrity issues:', issues);
        }
        return issues;
    }

    // Backup System
    function createBackup() {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                contracts: getData(LS_KEYS.CONTRACTS),
                sellers: getData(LS_KEYS.SELLERS),
                comps: getData(LS_KEYS.COMPS),
                members: getData(LS_KEYS.MEMBERS),
                profile: getData(LS_KEYS.PROFILE),
                settings: getData(LS_KEYS.SETTINGS),
                deals: getData(LS_KEYS.DEALS)
            }
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vaultforge-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup created', 'success');
        auditLog('Backup Created', 'Manual backup');
    }
/* END PART 25 OF 30 - LINE 2375 */// Restore Backup
    function restoreBackup(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                if(!backup.version ||!backup.data) {
                    showToast('Invalid backup file', 'error');
                    return;
                }
                
                if(!confirm('This will overwrite all current data. Continue?')) return;
                
                Object.keys(backup.data).forEach(key => {
                    const lsKey = 'vf_' + key;
                    saveData(lsKey, backup.data[key]);
                });
                
                showToast('Backup restored successfully', 'success');
                auditLog('Backup Restored', `Version ${backup.version} from ${backup.timestamp}`);
                setTimeout(() => location.reload(), 1500);
            } catch(err) {
                showToast('Error reading backup file', 'error');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }

    // Data Migration
    function migrateData() {
        const version = localStorage.getItem('vf_version') || '0';
        if(version === '1.0') return;
        
        // Migration from v0 to v1.0
        console.log('Migrating data to v1.0...');
        
        // Add default values to existing contracts
        const contracts = getData(LS_KEYS.CONTRACTS);
        contracts.forEach(c => {
            if(!c.emd) c.emd = 0;
            if(!c.closing) c.closing = '';
            if(!c.dateAdded) c.dateAdded = new Date().toISOString();
        });
        saveData(LS_KEYS.CONTRACTS, contracts);
        
        // Add default values to existing sellers
        const sellers = getData(LS_KEYS.SELLERS);
        sellers.forEach(s => {
            if(!s.motivation) s.motivation = 'Unknown';
            if(!s.dateAdded) s.dateAdded = new Date().toISOString();
        });
        saveData(LS_KEYS.SELLERS, sellers);
        
        localStorage.setItem('vf_version', '1.0');
        console.log('Migration complete');
    }

    // Error Handling
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        auditLog('Error', e.message);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        auditLog('Promise Rejection', e.reason.toString());
    });

    // Loading States
    function showLoading(elementId) {
        const el = document.getElementById(elementId);
        if(el) {
            el.innerHTML = '<div class="loading-spinner"></div>';
        }
    }

    function hideLoading(elementId) {
        const el = document.getElementById(elementId);
        if(el) {
            el.innerHTML = '';
        }
    }

    // Debounce Utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle Utility
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if(!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
/* END PART 26 OF 30 - LINE 2470 */// Print Functions
    function printElement(elementId) {
        const el = document.getElementById(elementId);
        if(!el) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Vaultforge Print</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f0f0f0; }
                    </style>
                </head>
                <body>${el.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // CSV Export
    function exportToCSV(data, filename) {
        if(!data || data.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
           ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'vaultforge-export.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported', 'success');
    }

    // Export Contracts to CSV
    function exportContracts() {
        const contracts = getData(LS_KEYS.CONTRACTS);
        exportToCSV(contracts, `contracts-${new Date().toISOString().split('T')[0]}.csv`);
        auditLog('Export', 'Contracts CSV');
    }

    // Export Sellers to CSV
    function exportSellers() {
        const sellers = getData(LS_KEYS.SELLERS);
        exportToCSV(sellers, `leads-${new Date().toISOString().split('T')[0]}.csv`);
        auditLog('Export', 'Sellers CSV');
    }

    // Clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard', 'success');
        } catch(err) {
            showToast('Failed to copy', 'error');
            console.error(err);
        }
    }

    function copyContractDetails(id) {
        const contract = getData(LS_KEYS.CONTRACTS).find(c => c.id === id);
        if(!contract) return;
        const text = `Address: ${contract.address}\nPrice: $${contract.price.toLocaleString()}\nFee: $${contract.fee.toLocaleString()}\nStatus: ${contract.status}`;
        copyToClipboard(text);
    }

    // Share Functions
    function shareViaEmail(subject, body) {
        const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    }

    function shareContract(id) {
        const contract = getData(LS_KEYS.CONTRACTS).find(c => c.id === id);
        if(!contract) return;
        const subject = `Deal Opportunity: ${contract.address}`;
        const body = `Check out this deal:\n\nAddress: ${contract.address}\nAsking: $${contract.price.toLocaleString()}\nARV: $${contract.arv.toLocaleString()}\nRepairs: $${contract.repairs.toLocaleString()}\nAssignment Fee: $${contract.fee.toLocaleString()}\n\nLet me know if you're interested!`;
        shareViaEmail(subject, body);
    }

    // Format Phone
    function formatPhone(phone) {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if(match) return `(${match[1]}) ${match[2]}-${match[3]}`;
        return phone;
    }

    // Format Address
    function formatAddress(address) {
        return address.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
/* END PART 27 OF 30 - LINE 2565 */// Search & Filter
    function searchContracts(query) {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const lowerQuery = query.toLowerCase();
        return contracts.filter(c => 
            c.address.toLowerCase().includes(lowerQuery) ||
            c.buyer.toLowerCase().includes(lowerQuery) ||
            c.seller.toLowerCase().includes(lowerQuery)
        );
    }

    function filterContractsByStatus(status) {
        const contracts = getData(LS_KEYS.CONTRACTS);
        if(status === 'all') return contracts;
        return contracts.filter(c => c.status === status);
    }

    // Sort Utilities
    function sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if(aVal < bVal) return direction === 'asc'? -1 : 1;
            if(aVal > bVal) return direction === 'asc'? 1 : -1;
            return 0;
        });
    }

    function sortContracts(key, direction) {
        const contracts = getData(LS_KEYS.CONTRACTS);
        const sorted = sortBy(contracts, key, direction);
        saveData(LS_KEYS.CONTRACTS, sorted);
        loadContracts();
    }

    // Pagination
    function paginate(array, page, perPage) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return {
            items: array.slice(start, end),
            totalPages: Math.ceil(array.length / perPage),
            currentPage: page,
            totalItems: array.length
        };
    }

    // Tab Navigation
    function switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(`tab-${tabName}`);
        const selectedBtn = document.getElementById(`btn-${tabName}`);
        if(selectedTab) selectedTab.style.display = 'block';
        if(selectedBtn) selectedBtn.classList.add('active');
        
        // Load tab-specific data
        if(tabName === 'contracts') loadContracts();
        if(tabName === 'sellers') loadSellers();
        if(tabName === 'comps') loadComps();
        if(tabName === 'dispo') loadDispoList();
        if(tabName === 'analytics') updateKPIDashboard();
        if(tabName === 'activity') loadActivityFeed();
        if(tabName === 'tasks') loadTasks();
        if(tabName === 'followups') loadFollowUps();
        
        currentTab = tabName;
        saveData('vf_last_tab', tabName);
    }

    // Modal System
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if(modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if(modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Close modal on backdrop click
    document.addEventListener('click', (e) => {
        if(e.target.classList.contains('modal-backdrop')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // View Switching
    function switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        const view = document.getElementById(`view-${viewName}`);
        if(view) view.style.display = 'block';
        currentView = viewName;
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('globalSearch')?.focus();
        }
        // Esc to close modals
        if(e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop').forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = 'auto';
        }
    });
/* END PART 28 OF 30 - LINE 2660 */// Initialization
    function initApp() {
        console.log('Vaultforge CRM v1.0 Initializing...');
        
        // Run data migration if needed
        migrateData();
        
        // Load profile
        const profile = getData(LS_KEYS.PROFILE);
        if(profile.name) {
            document.getElementById('userName').textContent = profile.name;
        }
        
        // Load last active tab or default to dashboard
        const lastTab = getData('vf_last_tab') || 'dashboard';
        switchTab(lastTab);
        
        // Load initial data
        loadContracts();
        loadSellers();
        loadComps();
        loadMembers();
        loadMessages();
        loadTasks();
        loadFollowUps();
        updateKPIDashboard();
        updateGoalProgress();
        loadActivityFeed();
        checkNotifications();
        
        // Validate data integrity
        const issues = validateData();
        if(issues.length > 0) {
            console.warn('Data issues found:', issues);
        }
        
        // Set up auto-refresh for notifications
        setInterval(() => {
            checkNotifications();
        }, 60000); // Every minute
        
        // Set up auto-save reminder
        setInterval(() => {
            const lastBackup = getData('vf_last_backup');
            const now = new Date();
            if(!lastBackup || (now - new Date(lastBackup)) > 7 * 24 * 60 * 60 * 1000) {
                showToast('Reminder: Create a backup', 'warning');
            }
        }, 3600000); // Every hour
        
        console.log('Vaultforge CRM Ready');
        logActivity('Application initialized');
    }

    // Theme Toggle
    function toggleTheme() {
        const settings = getData(LS_KEYS.SETTINGS);
        settings.theme = settings.theme === 'dark'? 'light' : 'dark';
        saveData(LS_KEYS.SETTINGS, settings);
        applyTheme(settings.theme);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.getElementById('themeIcon');
        if(themeIcon) {
            themeIcon.textContent = theme === 'dark'? '🌙' : '☀️';
        }
    }

    // Settings
    function saveSettings() {
        const settings = {
            theme: document.getElementById('settingTheme').value,
            currency: document.getElementById('settingCurrency').value,
            dateFormat: document.getElementById('settingDateFormat').value,
            notifications: document.getElementById('settingNotifications').checked,
            autoBackup: document.getElementById('settingAutoBackup').checked
        };
        saveData(LS_KEYS.SETTINGS, settings);
        applyTheme(settings.theme);
        showToast('Settings saved', 'success');
    }

    function loadSettings() {
        const settings = getData(LS_KEYS.SETTINGS);
        document.getElementById('settingTheme').value = settings.theme;
        document.getElementById('settingCurrency').value = settings.currency;
        document.getElementById('settingDateFormat').value = settings.dateFormat;
        document.getElementById('settingNotifications').checked = settings.notifications;
        document.getElementById('settingAutoBackup').checked = settings.autoBackup;
        applyTheme(settings.theme);
    }

    // Onload Handlers
    window.addEventListener('load', () => {
        initApp();
        loadSettings();
    });

    window.addEventListener('beforeunload', (e) => {
        // Auto-save any pending changes
        const hasUnsaved = document.querySelectorAll('[data-unsaved="true"]').length > 0;
        if(hasUnsaved) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Service Worker Registration for PWA
    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('Service Worker registered');
        }).catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
/* END PART 29 OF 30 - LINE 2755 */// Global Event Bindings
    document.addEventListener('DOMContentLoaded', () => {
        // Bind tab buttons
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // Bind modal triggers
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset.modal));
        });
        
        // Bind modal close buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.dataset.close));
        });
        
        // Bind search inputs
        const globalSearch = document.getElementById('globalSearch');
        if(globalSearch) {
            globalSearch.addEventListener('input', debounce((e) => {
                const query = e.target.value;
                if(query.length > 2) {
                    const results = searchContracts(query);
                    console.log('Search results:', results);
                }
            }, 300));
        }
        
        // Bind form submissions
        document.querySelectorAll('form[data-submit]').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const action = form.dataset.submit;
                if(typeof window[action] === 'function') {
                    window[action]();
                }
            });
        });
        
        // Initialize tooltips
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.dataset.tooltip;
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.top - 30) + 'px';
            });
            
            el.addEventListener('mouseleave', () => {
                document.querySelectorAll('.tooltip').forEach(t => t.remove());
            });
        });
        
        console.log('Event bindings complete');
    });

    // Export all functions to window for inline onclick handlers
    window.addContract = addContract;
    window.addSeller = addSeller;
    window.addComp = addComp;
    window.addMember = addMember;
    window.addToDispo = addToDispo;
    window.deleteContract = deleteContract;
    window.deleteSeller = deleteSeller;
    window.deleteComp = deleteComp;
    window.deleteMember = deleteMember;
    window.deleteDispo = deleteDispo;
    window.assignContract = assignContract;
    window.sendMessage = sendMessage;
    window.addTask = addTask;
    window.completeTask = completeTask;
    window.scheduleFollowUp = scheduleFollowUp;
    window.completeFollowUp = completeFollowUp;
    window.saveProfile = saveProfile;
    window.saveSettings = saveSettings;
    window.toggleTheme = toggleTheme;
    window.exportContracts = exportContracts;
    window.exportSellers = exportSellers;
    window.createBackup = createBackup;
    window.restoreBackup = restoreBackup;
    window.scoreLead = scoreLead;
    window.generateEmail = generateEmail;
    window.loadSMSTemplate = loadSMSTemplate;
    window.personalizeSMS = personalizeSMS;
    window.printElement = printElement;
    window.copyToClipboard = copyToClipboard;
    window.copyContractDetails = copyContractDetails;
    window.shareContract = shareContract;
    window.switchTab = switchTab;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.saveNote = saveNote;
    window.loadNote = loadNote;
    window.saveGoal = saveGoal;
    window.analyzeComps = analyzeComps;
    window.filterDispo = filterDispo;
    window.saveTitleCompany = saveTitleCompany;
    window.startDiligence = startDiligence;
    window.toggleDoc = toggleDoc;
    
    // Run auth check on load
    checkAuth();
    console.log('%cAll systems operational', 'color: #00ccff; font-size: 14px;');
    console.log('%cBuild: 30/30 parts complete', 'color: #ff00ff; font-size: 12px;');
</script>
