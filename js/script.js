/**
 * HELPING HANDS V4 - Core Logic
 * Handles Authentication, Data Persistence, QR Logic, and Task Workflow.
 */

const App = {
    // STATE & INITIALIZATION
    init: () => {
        App.Auth.checkAuthentication();
        App.UI.renderSidebar();
        App.UI.updateAuthUI();

        // Handle browser back/forward buttons for SPA
        window.addEventListener('popstate', () => {
            const path = window.location.pathname.split('/').pop();
            if (path && path.includes('.html')) {
                App.UI.loadPage(path);
            }
        });
    },

    // -------------------------------------------------------------------------
    // AUTHENTICATION MODULE
    // -------------------------------------------------------------------------
    Auth: {
        signUp: (name, email, password, role = 'Volunteer', isNewBornMother = false) => {
            if (!name || !email || !password) return alert('Fill all fields');

            const users = JSON.parse(localStorage.getItem('hh_users') || '[]');
            if (users.find(u => u.email === email)) return alert('Email already exists');

            const newUser = {
                id: 'USR-' + Date.now(),
                name,
                email,
                password,
                role: role === 'MedicalVolunteer' ? 'Volunteer' : role,
                isNewBornMother,
                isMedicalVolunteer: role === 'MedicalVolunteer',
                medicalStats: { tasks: 12, hours: 24, cases: 4 }, // Seed with some data for the transcript
                points: isNewBornMother ? 200 : 0,
                carePoints: isNewBornMother ? 200 : 0,
                registeredAt: new Date().toLocaleString()
            };
            // Newborn Mother gets start points

            users.push(newUser);
            localStorage.setItem('hh_users', JSON.stringify(users));

            // Auto Login
            localStorage.setItem('hh_currentUser', JSON.stringify(newUser));

            if (role === 'Sponsor') {
                window.location.href = 'sponsor_dashboard.html';
            } else {
                window.location.href = 'volunteer_dashboard.html';
            }
        },

        login: (email, password) => {
            // 1. Hardcoded Admin Check
            if (email === 'mail2pranesh23@gmail.com' && password === 'Pranesh2006!!!') {
                const adminUser = {
                    id: 'ADMIN_001',
                    name: 'Pranesh R',
                    email: email,
                    role: 'Admin',
                    badge: 'Gold'
                };
                localStorage.setItem('hh_currentUser', JSON.stringify(adminUser));
                window.location.href = 'dashboard.html';
                return;
            }

            const users = JSON.parse(localStorage.getItem('hh_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                // strict role check if needed, but we trust stored role
                localStorage.setItem('hh_currentUser', JSON.stringify(user));

                if (user.role === 'Sponsor') {
                    window.location.href = 'sponsor_dashboard.html';
                } else {
                    // Volunteer or others
                    window.location.href = 'volunteer_dashboard.html';
                }
            } else {
                alert('Invalid Credentials');
            }
        },

        logout: () => {
            localStorage.removeItem('hh_currentUser');
            window.location.href = 'index.html';
        },

        getCurrentUser: () => {
            return JSON.parse(localStorage.getItem('hh_currentUser'));
        },

        checkAuthentication: () => {
            const user = App.Auth.getCurrentUser();
            const path = window.location.pathname;
            const isPublicResult = path.includes('index.html') || path.includes('register.html');

            if (!user && !isPublicResult) {
                window.location.href = 'index.html';
            }

            // Redirect if on generic dashboard (SKIP for Admin)
            if (user && user.role !== 'Admin' && path.includes('dashboard.html') && !path.includes('volunteer_dashboard.html') && !path.includes('sponsor_dashboard.html')) {
                if (user.role === 'Sponsor') window.location.href = 'sponsor_dashboard.html';
                else window.location.href = 'volunteer_dashboard.html';
            }
        }
    },

    // -------------------------------------------------------------------------
    // DATA MODULE (CRUD)
    // -------------------------------------------------------------------------
    Data: {
        // --- Beggars ---
        getBeggars: () => JSON.parse(localStorage.getItem('hh_beggars') || '[]'),

        addBeggar: (beggar) => {
            const list = App.Data.getBeggars();
            beggar.id = 'BG-' + Date.now().toString().slice(-6);
            // V5 Requirement: "For every beggar give free 200 points when unique qr is generated"
            beggar.points = 200;
            beggar.joinedDate = new Date().toLocaleDateString();
            list.push(beggar);
            localStorage.setItem('hh_beggars', JSON.stringify(list));
            return beggar;
        },

        getBeggarById: (id) => {
            const list = App.Data.getBeggars();
            return list.find(b => b.id === id);
        },

        updateBeggarPoints: (id, pointsToAdd) => {
            const list = App.Data.getBeggars();
            const index = list.findIndex(b => b.id === id);
            if (index !== -1) {
                list[index].points = (parseInt(list[index].points) || 0) + parseInt(pointsToAdd);
                localStorage.setItem('hh_beggars', JSON.stringify(list));
                return list[index];
            }
        },

        // --- Sponsor / Funds ---
        Sponsor: {
            updateBeggarPoints: (id, amount) => {
                const list = App.Data.getBeggars();
                const beggar = list.find(b => b.id === id);
                if (beggar) {
                    beggar.points = (beggar.points || 0) + amount;
                    localStorage.setItem('hh_beggars', JSON.stringify(list));
                }
            },

            getFunds: () => {
                return JSON.parse(localStorage.getItem('hh_funds') || '{"total": 5000}'); // Initial seed funds
            },

            addFund: (amount) => {
                const funds = App.Sponsor.getFunds();
                funds.total += amount;
                localStorage.setItem('hh_funds', JSON.stringify(funds));

                // Also log transaction if not already handled by UI
                // This is a helper; UI usually handles specific logging for context
                return funds.total;
            }
        },

        // --- Fundraising Campaigns ---
        Fundraising: {
            getAll: () => {
                return [
                    {
                        id: 'F1',
                        title: 'Greenwood High Charity Drive',
                        organizer: 'Greenwood High School',
                        icon: 'fas fa-school',
                        date: 'Feb 15, 2026',
                        description: 'Students of Greenwood High organized a massive charity drive, collecting books, clothes, and funds for local shelters. Their dedication shows the power of youth in social change.',
                        amountRaised: '₹1,25,000',
                        impact: '500+ Families',
                        images: [
                            'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            'https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            'https://images.unsplash.com/photo-1526976668912-1a811878dd37?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                        ]
                    },
                    {
                        id: 'F2',
                        title: 'Village Sanitation Awareness',
                        organizer: 'Helping Hands Community',
                        icon: 'fas fa-bullhorn',
                        date: 'Jan 28, 2026',
                        description: 'Our volunteers conducted a door-to-door awareness campaign in Rampur village about hygiene and sanitation, distributing free hygiene kits to over 200 households.',
                        amountRaised: '₹85,000',
                        impact: '200 Households',
                        images: [
                            'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            'https://images.unsplash.com/photo-1593113598340-089debb92f78?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                        ]
                    }
                ];
            }
        },

        // --- Animations ---
        Animations: {
            showConfetti: () => {
                // Simple confetti effect (mock)
                const colors = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b'];
                for (let i = 0; i < 50; i++) {
                    const el = document.createElement('div');
                    el.style.position = 'fixed';
                    el.style.left = Math.random() * 100 + 'vw';
                    el.style.top = '-10px';
                    el.style.width = '10px';
                    el.style.height = '10px';
                    el.style.background = colors[Math.floor(Math.random() * colors.length)];
                    el.style.transition = 'top 2s ease-out, transform 2s linear';
                    el.style.zIndex = '9999';
                    document.body.appendChild(el);

                    setTimeout(() => {
                        el.style.top = '110vh';
                        el.style.transform = `rotate(${Math.random() * 360}deg)`;
                    }, 100);

                    setTimeout(() => el.remove(), 2000);
                }
            }
        },

        // --- Tasks ---
        getTasks: () => {
            const list = JSON.parse(localStorage.getItem('hh_tasks') || '[]');
            // Ensure predefined tasks exist
            if (list.length === 0) {
                App.Data.initPredefinedTasks();
                return JSON.parse(localStorage.getItem('hh_tasks') || '[]');
            }
            return list;
        },

        initPredefinedTasks: () => {
            const predefined = [
                { id: 'T1', title: 'Community Clean-up', description: 'Clean local park area', points: 50, status: 'Pending', type: 'Physical' },
                { id: 'T2', title: 'Elderly Companion', description: 'Spend time with elderly at shelter', points: 60, status: 'Pending', type: 'Social' },
                { id: 'T3', title: 'Plant Saplings', description: 'Plant 5 trees in designated area', points: 40, status: 'Pending', type: 'Physical' },
                { id: 'T4', title: 'Food Distribution', description: 'Distribute food packets to homeless', points: 50, status: 'Pending', type: 'Physical' },
                { id: 'T5', title: 'Teaching Kids', description: 'Teach basic math to street kids', points: 70, status: 'Pending', type: 'Educational' },
                { id: 'T6', title: 'Blood Donation', description: 'Donate blood at local camp', points: 100, status: 'Pending', type: 'Medical' },
                { id: 'T7', title: 'Animal Shelter Help', description: 'Assist at animal shelter', points: 40, status: 'Pending', type: 'Physical' },
                { id: 'T8', title: 'Recycling Drive', description: 'Collect and sort recyclables', points: 30, status: 'Pending', type: 'Physical' },
                { id: 'T9', title: 'First Aid Training', description: 'Complete basic first aid course', points: 80, status: 'Pending', type: 'Educational' },
                { id: 'T10', title: 'Online Mentoring', description: 'Mentor a student online', points: 60, status: 'Pending', type: 'Virtual' },
                { id: 'T11', title: 'Translation Help', description: 'Translate documents for NGO', points: 50, status: 'Pending', type: 'Virtual' },
                { id: 'T12', title: 'Graphic Design', description: 'Create posters for charity event', points: 70, status: 'Pending', type: 'Virtual' },
                { id: 'T13', title: 'Social Media Promotion', description: 'Promote Helping Hands on social media', points: 20, status: 'Pending', type: 'Virtual' },
                { id: 'T14', title: 'Fundraising assistant', description: 'Help organize fundraising event', points: 90, status: 'Pending', type: 'Social' },
                { id: 'T15', title: 'Toy Repair', description: 'Repair donated toys for kids', points: 40, status: 'Pending', type: 'Physical' },
                // Care Tasks for Mothers (Auto-assigned conceptually, but listed here)
                { id: 'T16', title: 'Baby Nutrition Class', description: 'Attend nutrition workshop', points: 50, status: 'Approved', type: 'Care' },
                { id: 'T17', title: 'Health Checkup', description: 'Monthly health checkup for baby', points: 100, status: 'Approved', type: 'Care' }
            ];
            localStorage.setItem('hh_tasks', JSON.stringify(predefined));
        },

        addTask: (task) => {
            const list = App.Data.getTasks();
            task.id = 'TSK-' + Date.now();
            task.status = 'Pending';
            task.timestamp = new Date().toLocaleString();
            list.push(task);
            localStorage.setItem('hh_tasks', JSON.stringify(list));
        },

        approveTask: (taskId) => {
            const list = App.Data.getTasks();
            const idx = list.findIndex(t => t.id === taskId);
            if (idx !== -1) {
                list[idx].status = 'Approved';
                localStorage.setItem('hh_tasks', JSON.stringify(list));

                // 1. Add points to Beggar (Beneficiary)
                App.Data.updateBeggarPoints(list[idx].beggarId, list[idx].points);

                // 2. Add points/hours to Volunteer (Approver)
                const currentUser = App.Auth.getCurrentUser();
                if (currentUser) {
                    App.Data.updateVolunteerStats(currentUser.email, 10, 1); // 10 pts per review, 1 hour (faked for MVP)
                    App.Gamification.checkLevelUp(currentUser.email);
                    App.Gamification.checkBadgeUnlock(currentUser.email);
                }

                return list[idx];
            }
        },

        updateVolunteerStats: (email, points, hours) => {
            const users = JSON.parse(localStorage.getItem('hh_users') || '[]');
            const idx = users.findIndex(u => u.email === email);
            if (idx !== -1) {
                users[idx].points = (users[idx].points || 0) + points;
                users[idx].hours = (users[idx].hours || 0) + hours;

                // Update Badge Level
                const p = users[idx].points;
                if (p > 500) users[idx].badge = 'Gold';
                else if (p > 200) users[idx].badge = 'Silver';
                else if (p > 50) users[idx].badge = 'Bronze';
                else users[idx].badge = 'Rookie';

                localStorage.setItem('hh_users', JSON.stringify(users));

                // If current user is this volunteer, update session storage too to reflect changes instantly
                const current = App.Auth.getCurrentUser();
                if (current.email === email) {
                    localStorage.setItem('hh_currentUser', JSON.stringify(users[idx]));
                }
            }
        },

        getVolunteers: () => {
            return JSON.parse(localStorage.getItem('hh_users') || '[]').filter(u => u.role === 'Volunteer' || u.role === 'Admin');
        },

        rejectTask: (taskId) => {
            const list = App.Data.getTasks();
            const idx = list.findIndex(t => t.id === taskId);
            if (idx !== -1) {
                list[idx].status = 'Rejected';
                localStorage.setItem('hh_tasks', JSON.stringify(list));
            }
        },

        // --- Medical Module ---
        Medical: {
            getRequests: () => JSON.parse(localStorage.getItem('hh_medical_requests') || '[]'),

            addRequest: (request) => {
                const list = App.Data.Medical.getRequests();
                request.id = 'MED-' + Date.now();
                request.status = 'Pending';
                request.timestamp = new Date().toLocaleString();
                list.push(request);
                localStorage.setItem('hh_medical_requests', JSON.stringify(list));
                return request;
            },

            acceptRequest: (requestId, volunteerEmail) => {
                const list = App.Data.Medical.getRequests();
                const idx = list.findIndex(r => r.id === requestId);
                if (idx !== -1) {
                    list[idx].status = 'Accepted';
                    list[idx].volunteerEmail = volunteerEmail;
                    localStorage.setItem('hh_medical_requests', JSON.stringify(list));
                    return list[idx];
                }
            },

            completeRequest: (requestId) => {
                const list = App.Data.Medical.getRequests();
                const idx = list.findIndex(r => r.id === requestId);
                if (idx !== -1) {
                    list[idx].status = 'Completed';
                    list[idx].completedAt = new Date().toLocaleString();
                    localStorage.setItem('hh_medical_requests', JSON.stringify(list));

                    // Update volunteer medical stats
                    const volunteerEmail = list[idx].volunteerEmail;
                    App.Data.Medical.updateVolunteerMedicalStats(volunteerEmail, 1, 2); // 1 task, 2 hours (mock)

                    return list[idx];
                }
            },

            updateVolunteerMedicalStats: (email, tasks, hours) => {
                const users = JSON.parse(localStorage.getItem('hh_users') || '[]');
                const idx = users.findIndex(u => u.email === email);
                if (idx !== -1) {
                    const medical = users[idx].medicalStats || { tasks: 0, hours: 0, caseTypes: {} };
                    medical.tasks += tasks;
                    medical.hours += hours;
                    // Mocking case type update based on request if we had it, but for now just general increment
                    users[idx].medicalStats = medical;
                    localStorage.setItem('hh_users', JSON.stringify(users));
                }
            },

            getStats: () => {
                const requests = App.Data.Medical.getRequests();
                const registry = App.Data.Medical.getRegistry();
                return {
                    completed: requests.filter(r => r.status === 'Completed').length,
                    activeVolunteers: [...new Set(requests.map(r => r.volunteerEmail).filter(e => e))].length,
                    registrySize: registry.length
                };
            },

            getRegistry: () => {
                let registry = JSON.parse(localStorage.getItem('hh_med_registry') || '[]');
                if (registry.length === 0) {
                    registry = App.Data.Medical.seedRegistry();
                }
                return registry;
            },

            seedRegistry: () => {
                const names = ["Dr. Aris", "Nurse Joy", "Student Sam", "Dr. Miller", "Nurse Ratched", "Medic Mike", "Student Sarah", "Dr. Gupta", "Nurse Lee", "Student Alex"];
                const beneficiaries = ["Old Man Jenkins", "Little Timmy", "Aunt May", "Granny Smith", "Uncle Ben", "The Wayne Family", "John Doe", "Jane Roe", "Bob Vila", "Martha Kent"];
                const registry = names.map((name, i) => ({
                    id: 'MV-' + (1000 + i),
                    name: name,
                    specialty: i % 3 === 0 ? 'Medical Student' : (i % 3 === 1 ? 'Registered Nurse' : 'General Physician'),
                    monitoring: beneficiaries[i],
                    status: 'Active',
                    hours: 20 + (i * 5)
                }));
                localStorage.setItem('hh_med_registry', JSON.stringify(registry));
                return registry;
            }
        }
    },

    // -------------------------------------------------------------------------
    // UI HELPER MODULE
    // -------------------------------------------------------------------------
    UI: {
        renderSidebar: () => {
            const sidebar = document.getElementById('sidebar-container');
            if (!sidebar) return;

            const user = App.Auth.getCurrentUser();
            const roleBadge = user ? `<span class="badge badge-success">${user.role}</span>` : '';

            sidebar.innerHTML = `
                <div class="brand">
                    <i class="fas fa-hand-holding-heart"></i> Helping Hands
                </div>
                <div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight:700;">${user ? user.name : 'Guest'}</div>
                    ${roleBadge}
                </div>
                
                <nav>
                    <a href="dashboard.html" class="nav-link"><i class="fas fa-chart-line"></i> Dashboard</a>
                    <a href="volunteer_profile.html" class="nav-link"><i class="fas fa-id-badge"></i> My Profile</a>
                    <a href="leaderboard.html" class="nav-link"><i class="fas fa-trophy"></i> Leaderboard</a>
                    <a href="transparency.html" class="nav-link"><i class="fas fa-hand-holding-usd"></i> Transparency</a>
                    <div style="height: 1px; background: #e2e8f0; margin: 0.5rem 1rem;"></div>
                    <a href="enroll.html" class="nav-link"><i class="fas fa-user-plus"></i> Enroll Beneficiary</a>
                    <a href="beggars.html" class="nav-link"><i class="fas fa-user-friends"></i> Care Beneficiaries</a>
                    <a href="scan.html" class="nav-link"><i class="fas fa-qrcode"></i> Scan QR</a>
                    <a href="tasks.html" class="nav-link"><i class="fas fa-clipboard-check"></i> Task Approvals</a>
                    <a href="medical.html" class="nav-link"><i class="fas fa-hand-holding-medical"></i> Medical Support</a>
                    <a href="redeem.html" class="nav-link"><i class="fas fa-shopping-basket"></i> Redeem Shop</a>
                    <a href="community.html" class="nav-link"><i class="fas fa-comments"></i> Community Chat</a>
                    <a href="certificate.html" class="nav-link"><i class="fas fa-certificate"></i> Certificates</a>
                    <a href="nutrition.html" class="nav-link"><i class="fas fa-baby"></i> Mothers & Nutrition</a>
                    ${user && user.isMedicalVolunteer ? '<a href="volunteer_dashboard.html#medical" class="nav-link"><i class="fas fa-hand-holding-medical"></i> Medical Help Center</a>' : ''}
                    <div style="height: 1px; background: #e2e8f0; margin: 0.5rem 1rem;"></div>
                    <a href="settings.html" class="nav-link"><i class="fas fa-cog"></i> Settings</a>
                    <a href="about.html" class="nav-link"><i class="fas fa-info-circle"></i> About Us</a>
                    <a href="help.html" class="nav-link"><i class="fas fa-question-circle"></i> Help & AI</a>
                    <a href="#" onclick="App.Auth.logout()" class="nav-link" style="color: var(--danger); margin-top: 2rem;"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </nav>
            `;

            // Render AI Chat if logged in
            if (user) App.AI.renderWidget();

            // Active state
            const currentPath = window.location.pathname;
            const links = sidebar.querySelectorAll('.nav-link');
            links.forEach(l => {
                if (l.getAttribute('href') && currentPath.includes(l.getAttribute('href'))) {
                    l.classList.add('active');
                }
            });
        },

        loadPage: async (pageUrl) => {
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Critical: .main-content not found in current DOM!");
                return;
            }

            // Diagnostic Loader
            mainContent.innerHTML = `
                <div id="spa-loader" style="height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
                    <div class="nutrition-icon" style="font-size: 3rem; color: var(--accent-mothers); animation: spin 2s linear infinite;">
                        <i class="fas fa-circle-notch"></i>
                    </div>
                    <div style="text-align: center;">
                        <p id="loader-status" class="text-secondary animate-pulse" style="font-weight: 600; margin: 0;">Loading Nutrition Hub...</p>
                        <p id="loader-step" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">Step 1: Initializing request...</p>
                    </div>
                </div>
            `;

            const updateStep = (text) => {
                const el = document.getElementById('loader-step');
                if (el) el.textContent = text;
            };

            try {
                updateStep("Step 2: Fetching " + pageUrl + "...");
                const response = await fetch(`${pageUrl}?t=${Date.now()}`);
                if (!response.ok) {
                    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                }

                updateStep("Step 3: Reading content bytes...");
                const html = await response.text();

                updateStep("Step 4: Parsing HTML structure...");
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                updateStep("Step 5: Locating main-content in source...");
                let newContent = doc.querySelector('.main-content') ||
                    doc.querySelector('.main_content') ||
                    doc.querySelector('main');

                const newStyles = doc.querySelectorAll('style');

                if (newContent) {
                    updateStep("Step 6: Injecting styles and content...");

                    // Direct Injection (Bypass setTimeout for stability)
                    newStyles.forEach((style, idx) => {
                        try {
                            const styleText = style.innerHTML || "";
                            if (styleText && !document.head.innerHTML.includes(styleText.substring(0, 100))) {
                                document.head.appendChild(style.cloneNode(true));
                            }
                        } catch (e) {
                            console.warn("Style injection error at index " + idx, e);
                        }
                    });

                    mainContent.innerHTML = newContent.innerHTML;

                    updateStep("Step 7: Finalizing UI states...");
                    App.UI.updateSidebarActiveState(pageUrl);
                    window.scrollTo({ top: 0, behavior: 'instant' });

                    if (pageUrl === 'dashboard.html') {
                        location.reload();
                    }
                    console.log("SPA Navigation Success: " + pageUrl);
                } else {
                    throw new Error(`Source file "${pageUrl}" is missing a '.main-content' or 'main' tag.`);
                }
            } catch (err) {
                console.error("SPA Engine Failure:", err);
                mainContent.innerHTML = `
                    <div style="padding: 3rem; text-align: center; color: var(--neon-red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Failed to Load Content</h3>
                        <p class="text-secondary">${err.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1.5rem;">Refresh Page</button>
                    </div>
                `;
                App.Notifications.showToast('Load Failure: ' + err.message, 'error');
            }
        },

        updateSidebarActiveState: (pageUrl) => {
            const links = document.querySelectorAll('.nav-link');
            links.forEach(l => {
                l.classList.remove('active');
                if (l.getAttribute('href') === pageUrl) {
                    l.classList.add('active');
                }
            });
        },

        updateAuthUI: () => {
            // Can be used to update top navbar if exists
        },

        generateQR: (text) => {
            return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
        }
    },

    // -------------------------------------------------------------------------
    // AI MODULE
    // -------------------------------------------------------------------------
    AI: {
        renderWidget: () => {
            if (document.getElementById('ai-widget-btn')) return;
            const btn = document.createElement('div');
            btn.id = 'ai-widget-btn';
            btn.innerHTML = '<i class="fas fa-robot"></i>';
            btn.onclick = () => {
                const win = document.getElementById('ai-chat-window');
                win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
            };
            document.body.appendChild(btn);

            const win = document.createElement('div');
            win.id = 'ai-chat-window';
            win.innerHTML = `
                <div style="background:var(--primary); color:white; padding:1rem; font-weight:700;">
                    Helping Hands AI
                    <i class="fas fa-times" style="float:right; cursor:pointer;" onclick="this.parentElement.parentElement.style.display='none'"></i>
                </div>
                <div id="ai-messages" style="flex:1; padding:1rem; overflow-y:auto; background:#f8fafc;">
                    <div style="margin-bottom:1rem;">
                        <span style="background:white; padding:0.5rem 1rem; border-radius:12px; border:1px solid #e2e8f0; display:inline-block; max-width:80%;">
                            Hello! I am your AI assistant. Ask me about tasks, verifications, or redeeming points.
                        </span>
                    </div>
                </div>
                <div style="padding:1rem; border-top:1px solid #e2e8f0; display:flex; gap:0.5rem;">
                    <input type="text" id="ai-input" placeholder="Ask something..." style="flex:1; padding:0.5rem; border:1px solid #cbd5e1; border-radius:8px;">
                    <button onclick="App.AI.send()" class="btn btn-primary" style="padding:0.5rem 1rem;"><i class="fas fa-paper-plane"></i></button>
                </div>
             `;
            document.body.appendChild(win);
        },

        send: () => {
            const input = document.getElementById('ai-input');
            const msg = input.value.trim();
            if (!msg) return;

            App.AI.addMsg(msg, 'user');
            input.value = '';

            // Mock AI Response Logic
            setTimeout(() => {
                let response = "I'm not sure about that. Try asking about 'tasks' or 'qr code'.";
                const m = msg.toLowerCase();
                if (m.includes('task') || m.includes('assign')) response = "To assign a task, scan the beneficiary's QR code or use the 'Task Approvals' page. Tasks are based on physical ability.";
                if (m.includes('point') || m.includes('redeem')) response = "Points are earned by completing tasks. 200 points are given on registration! Use the Redeem Shop to buy essentials.";
                if (m.includes('qr') || m.includes('scan')) response = "Every beneficiary gets a unique QR. Scan it to identify them instantly and prevent fraud.";
                if (m.includes('sponsor') || m.includes('money')) response = "Sponsors can track their funds in the 'Sponsor Transparency' module. We ensure 100% transparency.";

                App.AI.addMsg(response, 'ai');
            }, 1000);
        },

        addMsg: (text, sender) => {
            const div = document.createElement('div');
            div.style.marginBottom = '1rem';
            div.style.textAlign = sender === 'user' ? 'right' : 'left';

            const bubble = document.createElement('span');
            bubble.style.padding = '0.5rem 1rem';
            bubble.style.borderRadius = '12px';
            bubble.style.display = 'inline-block';
            bubble.style.maxWidth = '80%';

            if (sender === 'user') {
                bubble.style.background = 'var(--primary)';
                bubble.style.color = 'white';
            } else {
                bubble.style.background = 'white';
                bubble.style.border = '1px solid #e2e8f0';
            }

            bubble.textContent = text;
            div.appendChild(bubble);
            document.getElementById('ai-messages').appendChild(div);
            document.getElementById('ai-messages').scrollTop = document.getElementById('ai-messages').scrollHeight;
        }
    },

    // -------------------------------------------------------------------------
    // SPONSOR MODULE
    // -------------------------------------------------------------------------
    Sponsor: {
        getFunds: () => {
            // Mocked centralized fund data
            return JSON.parse(localStorage.getItem('hh_funds') || '{"total": 50000, "spent": 12500, "impacted": 142}');
        },
        addFund: (amount) => {
            const f = App.Sponsor.getFunds();
            f.total += amount;
            localStorage.setItem('hh_funds', JSON.stringify(f));
            return f;
        }
    },

    // -------------------------------------------------------------------------
    // GAMIFICATION MODULE
    // -------------------------------------------------------------------------
    Gamification: {
        checkLevelUp: (email) => {
            const users = JSON.parse(localStorage.getItem('hh_users') || '[]');
            const user = users.find(u => u.email === email);
            if (!user) return;

            const oldLevel = Math.floor(((user.points || 0) - 10) / 100) + 1;
            const newLevel = Math.floor((user.points || 0) / 100) + 1;

            if (newLevel > oldLevel) {
                App.Animations.showLevelUp(newLevel);
                App.Notifications.showToast(`🎉 Level Up! You're now Level ${newLevel}!`, 'success');
            }
        },

        checkBadgeUnlock: (email) => {
            const users = JSON.parse(localStorage.getItem('hh_users') || '[]');
            const user = users.find(u => u.email === email);
            if (!user) return;

            const points = user.points || 0;
            const badges = ['Bronze', 'Silver', 'Gold', 'Platinum'];
            const thresholds = [50, 200, 500, 1000];

            thresholds.forEach((threshold, index) => {
                if (points >= threshold && points - 10 < threshold) {
                    App.Animations.showConfetti();
                    App.Gamification.showAchievementBadge(badges[index]);
                }
            });
        },

        showAchievementBadge: (badgeName) => {
            const popup = document.createElement('div');
            popup.className = 'achievement-popup';
            const icons = {
                'Bronze': '🥉',
                'Silver': '🥈',
                'Gold': '🥇',
                'Platinum': '💎'
            };
            popup.innerHTML = `
                <div class="achievement-icon">${icons[badgeName] || '🏆'}</div>
                <h2 style="color: white; margin-bottom: 0.5rem;">${badgeName} Badge Unlocked!</h2>
                <p style="color: var(--text-muted);">Your kindness is making a real difference.</p>
                <button class="btn btn-primary mt-6" onclick="this.parentElement.remove()">Amazing!</button>
            `;
            document.body.appendChild(popup);
        },

        updateStreak: () => {
            const user = App.Auth.getCurrentUser();
            if (!user) return;

            const users = JSON.parse(localStorage.getItem('hh_users') || '[]');
            const idx = users.findIndex(u => u.email === user.email);
            if (idx === -1) return;

            const today = new Date().toDateString();
            const lastActive = users[idx].lastActiveDate;

            if (lastActive === today) return;

            if (lastActive) {
                const lastDate = new Date(lastActive);
                const diff = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);

                if (diff === 1) {
                    users[idx].streak = (users[idx].streak || 0) + 1;
                } else if (diff > 1) {
                    users[idx].streak = 1;
                }
            } else {
                users[idx].streak = 1;
            }

            users[idx].lastActiveDate = today;
            localStorage.setItem('hh_users', JSON.stringify(users));
            localStorage.setItem('hh_currentUser', JSON.stringify(users[idx]));
        }
    },

    // -------------------------------------------------------------------------
    // IMPACT NOTIFICATIONS MODULE (Live Feed)
    // -------------------------------------------------------------------------
    ImpactNotifications: {
        templates: [
            { title: "Sponsorship", desc: "{name} has sponsored ₹{amount} for meals!", icon: "💰", color: "green" },
            { title: "Sponsorship", desc: "{name} has sponsored ₹{amount} for basic essentials.", icon: "🪙", color: "green" },
            { title: "Physical Impact", desc: "{name} has funded {count} meals for a local shelter!", icon: "🍲", color: "orange" },
            { title: "Task Completed", desc: "{name} completed verification task at {location}.", icon: "📚", color: "blue" },
            { title: "Volunteer Skill", desc: "{name} just taught {count} children basic math.", icon: "✏️", color: "blue" },
            { title: "New Enrollment", desc: "{name} helped a new beneficiary join our system of dignity.", icon: "🤝", color: "orange" },
            { title: "Health Update", desc: "{name}'s child received a health checkup.", icon: "👩‍⚕️", color: "orange" },
            { title: "Redeem Success", desc: "{name} redeemed points for a hygiene kit!", icon: "🧼", color: "blue" }
        ],

        locations: ["Public Library", "City Hospital", "Sunrise Shelter", "Community Center", "Central Park"],

        start: () => {
            setInterval(() => {
                const template = App.ImpactNotifications.templates[Math.floor(Math.random() * App.ImpactNotifications.templates.length)];
                const msg = {
                    title: template.title,
                    icon: template.icon,
                    color: template.color,
                    desc: template.desc
                        .replace('{name}', App.Utils.getRandomName())
                        .replace('{amount}', [20, 30, 50, 100, 200, 500][Math.floor(Math.random() * 6)])
                        .replace('{count}', Math.floor(Math.random() * 8) + 2)
                        .replace('{location}', App.ImpactNotifications.locations[Math.floor(Math.random() * App.ImpactNotifications.locations.length)])
                };
                App.ImpactNotifications.show(msg);
            }, 3000 + Math.random() * 2000);
        },

        show: (msg) => {
            const notification = document.createElement('div');
            notification.className = `impact-notification`;
            notification.innerHTML = `
                <div class="impact-notification-icon ${msg.color || ''}">${msg.icon}</div>
                <div class="impact-notification-content">
                    <div class="impact-notification-title">${msg.title}</div>
                    <div class="impact-notification-desc">${msg.desc}</div>
                </div>
            `;
            document.body.appendChild(notification);

            // Refined animation trigger
            setTimeout(() => notification.classList.add('active'), 100);

            setTimeout(() => {
                notification.classList.remove('active');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }
    },

    // -------------------------------------------------------------------------
    // ANIMATIONS MODULE
    // -------------------------------------------------------------------------
    Animations: {
        showConfetti: () => {
            const container = document.createElement('div');
            container.className = 'confetti-container';
            document.body.appendChild(container);

            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 3 + 's';
                confetti.style.backgroundColor = ['#8b5cf6', '#0891b2', '#fbbf24', '#f87171', '#22d3ee'][Math.floor(Math.random() * 5)];
                container.appendChild(confetti);
            }

            setTimeout(() => container.remove(), 5000);
        },

        showLevelUp: (level) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            `;

            overlay.innerHTML = `
                <div style="text-align: center; animation: levelUpBurst 0.6s ease-out;">
                    <div style="font-size: 6rem; margin-bottom: 1rem;">🎉</div>
                    <h1 style="font-size: 4rem; font-weight: 900; background: linear-gradient(135deg, #5b21b6 0%, #0891b2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem;">
                        LEVEL UP!
                    </h1>
                    <p style="font-size: 2rem; color: white;">You're now Level ${level}</p>
                </div>
            `;

            document.body.appendChild(overlay);
            App.Animations.showConfetti();

            setTimeout(() => overlay.remove(), 3000);
        }
    },

    // -------------------------------------------------------------------------
    // NOTIFICATIONS MODULE
    // -------------------------------------------------------------------------
    Notifications: {
        showToast: (message, type = 'info') => {
            const toast = document.createElement('div');
            const colors = {
                success: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
                error: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
                info: 'linear-gradient(135deg, #5b21b6 0%, #0891b2 100%)',
                warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
            };

            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type]};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                animation: toastSlideIn 0.3s ease-out;
                font-weight: 600;
                max-width: 400px;
            `;
            toast.textContent = message;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'toastSlideOut 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    },

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    Utils: {
        getQueryParam: (param) => {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        },

        getRandomName: () => {
            const names = [
                "Ramesh", "Raj", "Thanush", "Priya", "Sneha", "Aarav", "Vivaan", "Ishaan",
                "Ananya", "Diya", "Arjun", "Vikram", "Kavita", "Meera", "Sanjay", "Amit",
                "Nitin", "Sonia", "Rahul", "Preeti", "Anjali", "Sita", "Rajesh", "Sunil",
                "Maya", "Neha", "Karan", "Pooja", "Vikrant", "Aditi", "Sahil"
            ];
            return names[Math.floor(Math.random() * names.length)];
        }
    },

    // -------------------------------------------------------------------------
    // MOTHERS HUB MODULE
    // -------------------------------------------------------------------------
    MothersHub: {
        data: [
            { id: 'M001', name: 'Sita Devi', babyName: 'Aarav', babyAge: '4 Weeks', babyGender: 'Male', status: 'Excellent', meals: 4, water: 8, milk: 450, powder: 6, weight: '3.8', height: '52', temp: '98.6', allocation: 50000, color: '#ec4899', image: '👶' },
            { id: 'M002', name: 'Anjali Rao', babyName: 'Vihaan', babyAge: '6 Weeks', babyGender: 'Male', status: 'Stable', meals: 3, water: 6, milk: 600, powder: 8, weight: '4.2', height: '55', temp: '98.4', allocation: 45000, color: '#6366f1', image: '🤱' },
            { id: 'M003', name: 'Priya Singh', babyName: 'Ananya', babyAge: '2 Weeks', babyGender: 'Female', status: 'Needs Care', meals: 5, water: 10, milk: 300, powder: 4, weight: '3.2', height: '48', temp: '99.1', allocation: 60000, color: '#10b981', image: '👶' },
            { id: 'M004', name: 'Sneha Kapur', babyName: 'Ishaan', babyAge: '8 Weeks', babyGender: 'Male', status: 'Healthy', meals: 4, water: 8, milk: 750, powder: 10, weight: '5.1', height: '58', temp: '98.5', allocation: 40000, color: '#f59e0b', image: '🤱' },
            { id: 'M005', name: 'Meera Bai', babyName: 'Diya', babyAge: '5 Weeks', babyGender: 'Female', status: 'Excellent', meals: 4, water: 9, milk: 500, powder: 7, weight: '4.0', height: '53', temp: '98.6', allocation: 55000, color: '#ec4899', image: '👶' },
            { id: 'M006', name: 'Kavita Iyer', babyName: 'Arjun', babyAge: '1 Week', babyGender: 'Male', status: 'Stable', meals: 3, water: 7, milk: 200, powder: 3, weight: '3.0', height: '45', temp: '98.7', allocation: 70000, color: '#6366f1', image: '👶' },
            { id: 'M007', name: 'Sunita Raj', babyName: 'Maya', babyAge: '10 Weeks', babyGender: 'Female', status: 'Healthy', meals: 5, water: 11, milk: 900, powder: 12, weight: '5.8', height: '60', temp: '98.4', allocation: 35000, color: '#10b981', image: '🤱' },
            { id: 'M008', name: 'Nisha Verma', babyName: 'Sahil', babyAge: '3 Weeks', babyGender: 'Male', status: 'Needs Care', meals: 4, water: 8, milk: 400, powder: 5, weight: '3.5', height: '50', temp: '99.0', allocation: 65000, color: '#f59e0b', image: '👶' }
        ],

        init: () => {
            const registry = document.getElementById('mothers-registry');
            if (registry) {
                App.MothersHub.renderRegistry();
                App.MothersHub.updateFundingUI();
            }
        },

        renderRegistry: () => {
            const container = document.getElementById('mothers-registry');
            if (!container) return;

            container.innerHTML = App.MothersHub.data.map(mother => `
                <div class="module-card hover-lift" onclick="App.MothersHub.openProfile('${mother.id}')" style="cursor: pointer; border-left: 4px solid ${mother.color};">
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="font-size: 2.5rem; background: var(--bg-tertiary); width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid ${mother.color}; shadow: 0 0 15px ${mother.color}44;">
                            ${mother.image}
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin-bottom: 0.25rem;">${mother.name}</h3>
                            <div class="text-secondary small">Baby: ${mother.babyName} • ${mother.babyAge}</div>
                            <div style="margin-top: 0.75rem;">
                                <span class="status-badge ${mother.status === 'Needs Care' ? 'status-alert' : 'status-done'}">${mother.status}</span>
                                <span class="status-badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); margin-left: 0.5rem;">Free Access</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right text-muted"></i>
                    </div>
                </div>
            `).join('');
        },

        openProfile: (id) => {
            const mother = App.MothersHub.data.find(m => m.id === id);
            if (!mother) return;

            // Hide Registry, Show Detail View
            document.getElementById('registry-view').style.display = 'none';
            document.getElementById('profile-detail-view').style.display = 'block';

            // Populate Detail View
            document.getElementById('current-mother-name').textContent = mother.name;
            document.getElementById('current-baby-name').textContent = `Baby ${mother.babyName}`;
            document.getElementById('current-baby-meta').textContent = `${mother.babyAge} Old • ${mother.babyGender}`;
            document.getElementById('parent-meals').textContent = mother.meals;
            document.getElementById('parent-water').textContent = mother.water;
            document.getElementById('baby-milk').textContent = mother.milk;
            document.getElementById('baby-powder').textContent = mother.powder;
            document.getElementById('baby-weight').innerHTML = `<i class="fas fa-weight"></i> ${mother.weight} kg`;
            document.getElementById('baby-height').innerHTML = `<i class="fas fa-ruler-vertical"></i> ${mother.height} cm`;
            document.getElementById('baby-temp').innerHTML = `<i class="fas fa-thermometer-half"></i> ${mother.temp}°F`;

            // Set current working ID for counters
            App.MothersHub.activeId = id;

            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        closeProfile: () => {
            document.getElementById('registry-view').style.display = 'block';
            document.getElementById('profile-detail-view').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        updateCount: (type, change) => {
            const mother = App.MothersHub.data.find(m => m.id === App.MothersHub.activeId);
            if (!mother) return;

            const fields = {
                'parent-meals': 'meals',
                'parent-water': 'water',
                'baby-milk': 'milk',
                'baby-powder': 'powder'
            };

            const field = fields[type];
            if (!field) return;

            mother[field] += change;
            if (mother[field] < 0) mother[field] = 0;

            // Update DOM
            const el = document.getElementById(type);
            if (el) {
                el.textContent = mother[field];
                el.style.transform = 'scale(1.2)';
                setTimeout(() => el.style.transform = 'scale(1)', 200);
            }

            // Sync with registry summary if needed
            App.Notifications.showToast(`Updated ${field} for ${mother.name}`, 'info');
        },

        updateFundingUI: () => {
            const totalAllocated = App.MothersHub.data.reduce((sum, m) => sum + m.allocation, 0);
            const fundingBar = document.getElementById('total-allocation-bar');
            const fundingText = document.getElementById('total-allocation-value');
            if (fundingBar && fundingText) {
                fundingText.textContent = `₹${(totalAllocated / 1000).toFixed(1)}K`;
                // Logic to show usage if we had real expenses
            }
        }
    }
};
document.addEventListener('DOMContentLoaded', () => {
    // If not on login page, init app
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('register.html')) {
        App.init();
        App.Gamification.updateStreak();
        App.ImpactNotifications.start();

        // Render Kindness Meter Widget
        const meter = document.createElement('div');
        meter.className = 'kindness-meter';
        const funds = App.Sponsor.getFunds();
        meter.innerHTML = `
            <div class="kindness-meter-value">₹${(funds.total / 1000).toFixed(1)}K</div>
            <div class="kindness-meter-label">Impact Raised</div>
        `;
        document.body.appendChild(meter);

        // Initialize Fundraising Section if on dashboard
        if (window.location.pathname.includes('dashboard.html') && !window.location.pathname.includes('sponsor') && !window.location.pathname.includes('volunteer')) {
            // ... fundraising code
        }

        // Ensure sidebar is rendered if placeholder exists (helpful for MPA loads)
        if (document.getElementById('sidebar-placeholder') || document.getElementById('sidebar-container')) {
            App.UI.renderSidebar();
        }
    }
});
