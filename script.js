// GradeBook+ Application
class GradeBookApp {
    constructor() {
        this.grades = this.loadFromStorage('grades') || [];
        this.exams = this.loadFromStorage('exams') || [];
        this.badges = this.loadFromStorage('badges') || [];
        this.initializeBadges();
        this.init();
    }

    // Initialize the application
    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.renderAllPages();
        this.checkAndUnlockBadges();
    }

    // Setup navigation between pages
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show target page
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(targetPage).classList.add('active');
                
                // Render page-specific content
                this.renderPage(targetPage);
            });
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        // CSV file upload
        const csvInput = document.getElementById('csv-file');
        csvInput.addEventListener('change', (e) => this.handleCSVUpload(e));

        // Drag and drop for CSV
        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'text/csv') {
                this.processCSVFile(files[0]);
            }
        });

        // Manual grade entry form
        const gradeForm = document.getElementById('grade-form');
        gradeForm.addEventListener('submit', (e) => this.handleManualGradeEntry(e));

        // Target calculator form
        const targetForm = document.getElementById('target-form');
        targetForm.addEventListener('submit', (e) => this.handleTargetCalculation(e));

        // Exam form
        const examForm = document.getElementById('exam-form');
        examForm.addEventListener('submit', (e) => this.handleExamEntry(e));
    }

    // Handle CSV file upload
    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            this.processCSVFile(file);
        } else {
            this.showMessage('Please select a valid CSV file', 'error');
        }
    }

    // Process CSV file
    processCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                let addedCount = 0;

                lines.forEach((line, index) => {
                    if (index === 0) return; // Skip header row if present
                    
                    const [subject, grade, date, examType] = line.split(',').map(item => item.trim());
                    
                    if (subject && grade && date && examType) {
                        const gradeData = {
                            id: Date.now() + Math.random(),
                            subject: subject,
                            grade: parseFloat(grade),
                            date: date,
                            examType: examType,
                            timestamp: Date.now()
                        };
                        
                        this.grades.push(gradeData);
                        addedCount++;
                    }
                });

                if (addedCount > 0) {
                    this.saveToStorage('grades', this.grades);
                    this.showMessage(`Successfully imported ${addedCount} grades`, 'success');
                    this.renderAllPages();
                    this.checkAndUnlockBadges();
                } else {
                    this.showMessage('No valid grade data found in CSV', 'error');
                }
            } catch (error) {
                this.showMessage('Error processing CSV file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Handle manual grade entry
    handleManualGradeEntry(event) {
        event.preventDefault();
        
        const subject = document.getElementById('subject').value;
        const grade = parseFloat(document.getElementById('grade').value);
        const date = document.getElementById('date').value;
        const examType = document.getElementById('exam-type').value;

        const gradeData = {
            id: Date.now() + Math.random(),
            subject: subject,
            grade: grade,
            date: date,
            examType: examType,
            timestamp: Date.now()
        };

        this.grades.push(gradeData);
        this.saveToStorage('grades', this.grades);
        
        // Reset form
        event.target.reset();
        
        this.showMessage('Grade added successfully', 'success');
        this.renderAllPages();
        this.checkAndUnlockBadges();
    }

    // Handle target calculation
    handleTargetCalculation(event) {
        event.preventDefault();
        
        const targetGrade = parseFloat(document.getElementById('target-grade').value);
        const remainingExams = parseInt(document.getElementById('remaining-exams').value);
        
        if (this.grades.length === 0) {
            this.showTargetResult('Add some grades first to use the target calculator', 'error');
            return;
        }

        const currentAverage = this.calculateAverage();
        const totalExams = this.grades.length + remainingExams;
        const requiredGrade = (targetGrade * totalExams - currentAverage * this.grades.length) / remainingExams;

        let message, type;
        if (requiredGrade <= 100 && requiredGrade >= 0) {
            message = `You need to average ${requiredGrade.toFixed(1)}% in your remaining ${remainingExams} exams to reach your target of ${targetGrade}%`;
            type = requiredGrade <= 90 ? 'success' : 'warning';
        } else if (requiredGrade > 100) {
            message = `Your target is not achievable. You would need ${requiredGrade.toFixed(1)}% average in remaining exams.`;
            type = 'error';
        } else {
            message = `Great! You've already exceeded your target. Current average: ${currentAverage.toFixed(1)}%`;
            type = 'success';
        }

        this.showTargetResult(message, type);
    }

    // Show target calculation result
    showTargetResult(message, type) {
        const resultDiv = document.getElementById('target-result');
        resultDiv.className = `target-result ${type}`;
        resultDiv.textContent = message;
        resultDiv.style.display = 'block';
    }

    // Handle exam entry
    handleExamEntry(event) {
        event.preventDefault();
        
        const subject = document.getElementById('exam-subject').value;
        const date = document.getElementById('exam-date').value;

        const examData = {
            id: Date.now() + Math.random(),
            subject: subject,
            date: date,
            timestamp: Date.now()
        };

        this.exams.push(examData);
        this.saveToStorage('exams', this.exams);
        
        // Reset form
        event.target.reset();
        
        this.showMessage('Exam added successfully', 'success');
        this.renderAllPages();
    }

    // Render all pages
    renderAllPages() {
        this.renderHomePage();
        this.renderDashboard();
        this.renderBadges();
    }

    // Render specific page
    renderPage(pageName) {
        switch(pageName) {
            case 'home':
                this.renderHomePage();
                break;
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'badges':
                this.renderBadges();
                break;
        }
    }

    // Render home page
    renderHomePage() {
        // Update quick stats
        document.getElementById('total-subjects').textContent = this.getUniqueSubjects().length;
        document.getElementById('average-grade').textContent = 
            this.grades.length > 0 ? `${this.calculateAverage().toFixed(1)}%` : '-';
        document.getElementById('badges-count').textContent = this.getEarnedBadges().length;

        // Update upcoming exams
        this.renderUpcomingExams();
        
        // Update recent activity
        this.renderRecentActivity();
    }

    // Render upcoming exams
    renderUpcomingExams() {
        const examList = document.getElementById('exam-list');
        const upcomingExams = this.getUpcomingExams();

        if (upcomingExams.length === 0) {
            examList.innerHTML = '<p class="no-data">No upcoming exams scheduled</p>';
            return;
        }

        examList.innerHTML = upcomingExams.slice(0, 3).map(exam => {
            const daysLeft = this.getDaysUntil(exam.date);
            return `
                <div class="countdown-item">
                    <div class="countdown-header">
                        <span class="countdown-subject">${exam.subject}</span>
                        <span class="countdown-days">${daysLeft} days</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render recent activity
    renderRecentActivity() {
        const activityFeed = document.getElementById('activity-feed');
        const recentGrades = this.grades
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 3);

        if (recentGrades.length === 0) {
            activityFeed.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        activityFeed.innerHTML = recentGrades.map(grade => `
            <div class="activity-item">
                <strong>${grade.subject}</strong>: ${grade.grade}% (${grade.examType})
                <br><small>${new Date(grade.timestamp).toLocaleDateString()}</small>
            </div>
        `).join('');
    }

    // Render dashboard
    renderDashboard() {
        this.renderPerformanceStats();
        this.renderCharts();
        this.renderStudyTips();
        this.renderExamCountdowns();
    }

    // Render performance statistics
    renderPerformanceStats() {
        if (this.grades.length === 0) {
            document.getElementById('avg-grade').textContent = '0%';
            document.getElementById('highest-grade').textContent = '0%';
            document.getElementById('lowest-grade').textContent = '0%';
            document.getElementById('total-exams').textContent = '0';
            return;
        }

        const grades = this.grades.map(g => g.grade);
        document.getElementById('avg-grade').textContent = `${this.calculateAverage().toFixed(1)}%`;
        document.getElementById('highest-grade').textContent = `${Math.max(...grades)}%`;
        document.getElementById('lowest-grade').textContent = `${Math.min(...grades)}%`;
        document.getElementById('total-exams').textContent = this.grades.length;
    }

    // Render charts
    renderCharts() {
        this.renderBarChart();
        this.renderLineChart();
    }

    // Render bar chart for grades by subject
    renderBarChart() {
        const canvas = document.getElementById('bar-chart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.grades.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        const subjectAverages = this.getSubjectAverages();
        const subjects = Object.keys(subjectAverages);
        const maxGrade = Math.max(...Object.values(subjectAverages));
        
        const barWidth = (canvas.width - 80) / subjects.length;
        const chartHeight = canvas.height - 80;

        // Draw bars
        subjects.forEach((subject, index) => {
            const barHeight = (subjectAverages[subject] / maxGrade) * chartHeight;
            const x = 40 + index * barWidth + barWidth * 0.1;
            const y = canvas.height - 40 - barHeight;

            // Bar
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);

            // Value label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${subjectAverages[subject].toFixed(1)}%`,
                x + barWidth * 0.4,
                y - 5
            );

            // Subject label
            ctx.save();
            ctx.translate(x + barWidth * 0.4, canvas.height - 10);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillText(subject, 0, 0);
            ctx.restore();
        });

        // Y-axis
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, canvas.height - 40);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 100; i += 20) {
            const y = canvas.height - 40 - (i / 100) * chartHeight;
            ctx.fillText(`${i}%`, 35, y + 3);
        }
    }

    // Render line chart for progress over time
    renderLineChart() {
        const canvas = document.getElementById('line-chart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.grades.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        const sortedGrades = [...this.grades].sort((a, b) => new Date(a.date) - new Date(b.date));
        const chartWidth = canvas.width - 80;
        const chartHeight = canvas.height - 80;

        // Calculate running averages
        const runningAverages = [];
        for (let i = 0; i < sortedGrades.length; i++) {
            const gradesUpToIndex = sortedGrades.slice(0, i + 1);
            const average = gradesUpToIndex.reduce((sum, g) => sum + g.grade, 0) / gradesUpToIndex.length;
            runningAverages.push(average);
        }

        const maxGrade = Math.max(...runningAverages);
        const minGrade = Math.min(...runningAverages);
        const gradeRange = maxGrade - minGrade || 1;

        // Draw line
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();

        runningAverages.forEach((average, index) => {
            const x = 40 + (index / (runningAverages.length - 1)) * chartWidth;
            const y = canvas.height - 40 - ((average - minGrade) / gradeRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw points
            ctx.fillStyle = '#764ba2';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        ctx.stroke();

        // Axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, canvas.height - 40);
        ctx.moveTo(40, canvas.height - 40);
        ctx.lineTo(canvas.width - 20, canvas.height - 40);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = minGrade + (gradeRange * i / 4);
            const y = canvas.height - 40 - (i / 4) * chartHeight;
            ctx.fillText(`${value.toFixed(1)}%`, 35, y + 3);
        }
    }

    // Render study tips
    renderStudyTips() {
        const tipsContainer = document.getElementById('tips-container');
        
        if (this.grades.length === 0) {
            tipsContainer.innerHTML = '<p class="no-data">Add some grades to get personalized study tips!</p>';
            return;
        }

        const subjectAverages = this.getSubjectAverages();
        const weakestSubjects = Object.entries(subjectAverages)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 3);

        const tips = {
            'Mathematics': 'Practice problem-solving daily and review fundamental concepts.',
            'Science': 'Create mind maps and conduct regular experiments or observations.',
            'English': 'Read extensively and practice writing essays regularly.',
            'History': 'Use timelines and create connections between historical events.',
            'Geography': 'Use maps and visual aids to understand spatial relationships.',
            'Chemistry': 'Focus on understanding chemical reactions and balancing equations.',
            'Physics': 'Practice numerical problems and understand the underlying principles.',
            'Biology': 'Use diagrams and flowcharts to understand biological processes.',
            'default': 'Create a study schedule and practice active recall techniques.'
        };

        tipsContainer.innerHTML = weakestSubjects.map(([subject, average]) => `
            <div class="tip-item">
                <div class="tip-subject">${subject} (${average.toFixed(1)}%)</div>
                <div>${tips[subject] || tips.default}</div>
            </div>
        `).join('');
    }

    // Render exam countdowns
    renderExamCountdowns() {
        const countdownContainer = document.getElementById('countdown-container');
        const upcomingExams = this.getUpcomingExams();

        if (upcomingExams.length === 0) {
            countdownContainer.innerHTML = '<p class="no-data">No upcoming exams</p>';
            return;
        }

        countdownContainer.innerHTML = upcomingExams.map(exam => {
            const daysLeft = this.getDaysUntil(exam.date);
            const totalDays = 30; // Assume 30 days planning period
            const progress = Math.max(0, (totalDays - daysLeft) / totalDays * 100);

            return `
                <div class="countdown-item">
                    <div class="countdown-header">
                        <span class="countdown-subject">${exam.subject}</span>
                        <span class="countdown-days">${daysLeft} days left</span>
                    </div>
                    <div class="countdown-bar">
                        <div class="countdown-progress" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initialize badge system
    initializeBadges() {
        const allBadges = [
            {
                id: 'first_a',
                name: 'First A Grade',
                description: 'Score your first A grade (90% or above)',
                icon: '🎯',
                condition: () => this.grades.some(g => g.grade >= 90)
            },
            {
                id: 'consistent_improvement',
                name: 'Consistent Improvement',
                description: 'Show improvement over 3 consecutive exams',
                icon: '📈',
                condition: () => this.checkConsistentImprovement()
            },
            {
                id: 'perfect_score',
                name: 'Perfect Score',
                description: 'Achieve a perfect 100% score',
                icon: '💯',
                condition: () => this.grades.some(g => g.grade === 100)
            },
            {
                id: 'subject_master',
                name: 'Subject Master',
                description: 'Maintain 85%+ average in any subject',
                icon: '👑',
                condition: () => Object.values(this.getSubjectAverages()).some(avg => avg >= 85)
            },
            {
                id: 'exam_warrior',
                name: 'Exam Warrior',
                description: 'Complete 10 or more exams',
                icon: '⚔️',
                condition: () => this.grades.length >= 10
            },
            {
                id: 'high_achiever',
                name: 'High Achiever',
                description: 'Maintain overall average above 80%',
                icon: '🏆',
                condition: () => this.grades.length >= 5 && this.calculateAverage() >= 80
            }
        ];

        // Initialize badges if not already done
        if (this.badges.length === 0) {
            this.badges = allBadges.map(badge => ({
                ...badge,
                earned: false,
                earnedDate: null
            }));
            this.saveToStorage('badges', this.badges);
        } else {
            // Update badge definitions while preserving earned status
            allBadges.forEach(newBadge => {
                const existingBadge = this.badges.find(b => b.id === newBadge.id);
                if (existingBadge) {
                    Object.assign(existingBadge, { ...newBadge, earned: existingBadge.earned, earnedDate: existingBadge.earnedDate });
                } else {
                    this.badges.push({ ...newBadge, earned: false, earnedDate: null });
                }
            });
        }
    }

    // Check and unlock badges
    checkAndUnlockBadges() {
        let newBadges = [];
        
        this.badges.forEach(badge => {
            if (!badge.earned && badge.condition()) {
                badge.earned = true;
                badge.earnedDate = new Date().toISOString();
                newBadges.push(badge);
            }
        });

        if (newBadges.length > 0) {
            this.saveToStorage('badges', this.badges);
            newBadges.forEach(badge => {
                this.showMessage(`Badge unlocked: ${badge.name}!`, 'success');
            });
        }
    }

    // Check for consistent improvement
    checkConsistentImprovement() {
        if (this.grades.length < 3) return false;
        
        const sortedGrades = [...this.grades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (let i = 0; i <= sortedGrades.length - 3; i++) {
            const first = sortedGrades[i].grade;
            const second = sortedGrades[i + 1].grade;
            const third = sortedGrades[i + 2].grade;
            
            if (second > first && third > second) {
                return true;
            }
        }
        
        return false;
    }

    // Render badges page
    renderBadges() {
        const badgesContainer = document.getElementById('badges-container');
        
        badgesContainer.innerHTML = this.badges.map(badge => `
            <div class="badge-card ${badge.earned ? 'earned' : 'locked'}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
                <div class="badge-status ${badge.earned ? 'earned' : 'locked'}">
                    ${badge.earned ? 'Earned' : 'Locked'}
                </div>
                ${badge.earned && badge.earnedDate ? 
                    `<div class="badge-date">Earned: ${new Date(badge.earnedDate).toLocaleDateString()}</div>` : 
                    ''}
            </div>
        `).join('');
    }

    // Utility functions
    calculateAverage() {
        if (this.grades.length === 0) return 0;
        return this.grades.reduce((sum, grade) => sum + grade.grade, 0) / this.grades.length;
    }

    getUniqueSubjects() {
        return [...new Set(this.grades.map(g => g.subject))];
    }

    getSubjectAverages() {
        const subjects = {};
        this.grades.forEach(grade => {
            if (!subjects[grade.subject]) {
                subjects[grade.subject] = [];
            }
            subjects[grade.subject].push(grade.grade);
        });

        const averages = {};
        Object.keys(subjects).forEach(subject => {
            const grades = subjects[subject];
            averages[subject] = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
        });

        return averages;
    }

    getUpcomingExams() {
        const today = new Date();
        return this.exams
            .filter(exam => new Date(exam.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getDaysUntil(dateString) {
        const today = new Date();
        const examDate = new Date(dateString);
        const diffTime = examDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getEarnedBadges() {
        return this.badges.filter(badge => badge.earned);
    }

    // Storage functions
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // Show messages
    showMessage(message, type = 'success') {
        const messageContainer = document.getElementById('message-container');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        messageContainer.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GradeBookApp();
});
