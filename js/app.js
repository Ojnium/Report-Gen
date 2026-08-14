/**
 * ============================================
 * SCHOOL RESULT & TESTIMONIAL GENERATOR
 * Freedom International School, Kubwa, Abuja
 *
 * CLIENT-SIDE ONLY — No data leaves the browser.
 *
 * Both WAEC and NECO use a 4-column dual-side grid.
 * WAEC has F in summary; NECO does not.
 * NECO table: 32mm height (fewer rows).
 * WAEC table: 50mm height (more rows).
 * Testimonial includes class on subjects line + principal name.
 *
 * PRINTING: Hidden iframe approach.
 * ============================================
 */

(function () {
    'use strict';

    var DEFAULT_SUBJECTS = [
        'English Language', 'Mathematics', 'Physics',
        'Chemistry', 'Biology', 'Civic Education',
        'Economics', 'Geography'
    ];

    var GRADE_OPTIONS = ['A1','B2','B3','C4','C5','C6','D7','E8','F9'];

    var GRADE_CATEGORY = {
        'A1':'a', 'B2':'b', 'B3':'b',
        'C4':'c', 'C5':'c', 'C6':'c',
        'D7':'d', 'E8':'e', 'F9':'f'
    };

    var currentDocType = 'waec';
    var waecPhotoData = null;
    var necoPhotoData = null;
    var printIframe = null;

    var schoolSettings = {
        name: 'Freedom International School',
        address: 'Kubwa, Abuja',
        motto: 'Education For True Freedom',
        phone1: '0706 315 3466',
        phone2: '0913 240 6854',
        principal: ''
    };

    /* ------------------------------------------
       INIT
       ------------------------------------------ */
    function init() {
        loadSettings();
        loadLastDocType();
        initDocSelector();
        initSettingsModal();
        initDefaultSubjects('waec');
        initDefaultSubjects('neco');
        initPhotoUpload('waec');
        initPhotoUpload('neco');
        initFormListeners();
        updatePreviewScale();
        window.addEventListener('resize', updatePreviewScale);
    }

    /* ------------------------------------------
       DOCUMENT SELECTOR
       ------------------------------------------ */
    function initDocSelector() {
        var cards = document.querySelectorAll('.selector-card');
        for (var i = 0; i < cards.length; i++) {
            (function (card) {
                card.addEventListener('click', function () { switchDocument(card.dataset.type); });
                card.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchDocument(card.dataset.type); }
                });
            })(cards[i]);
        }
    }

    function switchDocument(type) {
        currentDocType = type;
        try { localStorage.setItem('lastDocType', type); } catch (e) {}

        var cards = document.querySelectorAll('.selector-card');
        for (var i = 0; i < cards.length; i++) {
            var isActive = cards[i].dataset.type === type;
            cards[i].classList.toggle('active', isActive);
            cards[i].setAttribute('aria-pressed', isActive);
        }
        var forms = document.querySelectorAll('.doc-form');
        for (var j = 0; j < forms.length; j++) forms[j].classList.remove('active');
        document.getElementById(type + 'Form').classList.add('active');

        var docs = document.querySelectorAll('.document-page');
        for (var k = 0; k < docs.length; k++) docs[k].style.display = 'none';
        document.getElementById(type + 'Doc').style.display = 'block';

        updatePreview();
        setTimeout(updatePreviewScale, 50);
    }

    /* ------------------------------------------
       SETTINGS MODAL
       ------------------------------------------ */
    function initSettingsModal() {
        var modal = document.getElementById('settingsModal');
        function openModal() {
            document.getElementById('setSchoolName').value = schoolSettings.name;
            document.getElementById('setAddress').value = schoolSettings.address;
            document.getElementById('setMotto').value = schoolSettings.motto;
            document.getElementById('setPhone1').value = schoolSettings.phone1;
            document.getElementById('setPhone2').value = schoolSettings.phone2;
            document.getElementById('setPrincipal').value = schoolSettings.principal;
            modal.classList.add('open');
        }
        function closeModal() { modal.classList.remove('open'); }

        document.getElementById('settingsBtn').addEventListener('click', openModal);
        document.getElementById('settingsClose').addEventListener('click', closeModal);
        document.getElementById('settingsCancel').addEventListener('click', closeModal);
        modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

        document.getElementById('settingsSave').addEventListener('click', function () {
            schoolSettings.name = document.getElementById('setSchoolName').value.trim();
            schoolSettings.address = document.getElementById('setAddress').value.trim();
            schoolSettings.motto = document.getElementById('setMotto').value.trim();
            schoolSettings.phone1 = document.getElementById('setPhone1').value.trim();
            schoolSettings.phone2 = document.getElementById('setPhone2').value.trim();
            schoolSettings.principal = document.getElementById('setPrincipal').value.trim();
            saveSettings();
            closeModal();
            showToast('Settings saved', 'success');
        });
    }

    /* ------------------------------------------
       LOCAL STORAGE
       ------------------------------------------ */
    function saveSettings() { try { localStorage.setItem('schoolSettings', JSON.stringify(schoolSettings)); } catch (e) {} }
    function loadSettings() {
        try {
            var stored = localStorage.getItem('schoolSettings');
            if (stored) { var p = JSON.parse(stored); for (var k in p) { if (p.hasOwnProperty(k)) schoolSettings[k] = p[k]; } }
        } catch (e) {}
    }
    function loadLastDocType() {
        try {
            var s = localStorage.getItem('lastDocType');
            if (s && ['waec','neco','testimonial'].indexOf(s) !== -1) switchDocument(s);
        } catch (e) {}
    }

    /* ------------------------------------------
       SUBJECT ROWS
       ------------------------------------------ */
    function initDefaultSubjects(type) {
        var c = document.getElementById(type + 'Subjects');
        c.innerHTML = '';
        for (var i = 0; i < DEFAULT_SUBJECTS.length; i++) addSubjectRow(c, DEFAULT_SUBJECTS[i], '');
    }

    function addSubjectRow(container, subject, grade) {
        var row = document.createElement('div');
        row.className = 'subject-row';
        var inp = document.createElement('input');
        inp.type = 'text'; inp.placeholder = 'Subject name'; inp.value = subject || '';
        inp.addEventListener('input', updatePreview);
        var sel = document.createElement('select');
        sel.innerHTML = '<option value="">Grade</option>';
        for (var i = 0; i < GRADE_OPTIONS.length; i++) {
            var o = document.createElement('option');
            o.value = GRADE_OPTIONS[i]; o.textContent = GRADE_OPTIONS[i];
            if (GRADE_OPTIONS[i] === grade) o.selected = true;
            sel.appendChild(o);
        }
        sel.addEventListener('change', updatePreview);
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn-remove';
        btn.innerHTML = '<i class="fas fa-times"></i>';
        btn.setAttribute('aria-label', 'Remove subject');
        btn.addEventListener('click', function () { row.remove(); updatePreview(); });
        row.appendChild(inp); row.appendChild(sel); row.appendChild(btn);
        container.appendChild(row);
    }

    document.getElementById('waecAddSubject').addEventListener('click', function () {
        addSubjectRow(document.getElementById('waecSubjects'), '', ''); updatePreview();
    });
    document.getElementById('necoAddSubject').addEventListener('click', function () {
        addSubjectRow(document.getElementById('necoSubjects'), '', ''); updatePreview();
    });

    /* ------------------------------------------
       PHOTO UPLOAD
       ------------------------------------------ */
    function initPhotoUpload(type) {
        var fi = document.getElementById(type + 'Photo');
        var pb = document.getElementById(type + 'PhotoPreview');
        fi.addEventListener('change', function () {
            var f = this.files[0]; if (!f) return;
            if (['image/jpeg','image/jpg','image/png','image/webp'].indexOf(f.type) === -1) { showToast('Use JPG, PNG, or WEBP', 'error'); this.value = ''; return; }
            if (f.size > 5*1024*1024) { showToast('Image must be under 5MB', 'error'); this.value = ''; return; }
            var r = new FileReader();
            r.onload = function (e) {
                var d = e.target.result;
                if (type === 'waec') waecPhotoData = d; else necoPhotoData = d;
                pb.classList.add('has-photo');
                var img = pb.querySelector('img');
                if (!img) { img = document.createElement('img'); pb.appendChild(img); }
                img.src = d; img.alt = 'Passport'; updatePreview();
            };
            r.readAsDataURL(f);
        });
    }

    /* ------------------------------------------
       FORM LISTENERS
       ------------------------------------------ */
    function initFormListeners() {
        function bind(ids) { for (var i = 0; i < ids.length; i++) { var el = document.getElementById(ids[i]); if (el) el.addEventListener('input', updatePreview); } }
        bind(['waecName','waecYear','waecExamNo','waecClass','waecCertNo']);
        bind(['necoName','necoYear','necoExamNo','necoClass','necoCertNo']);
        bind(['testName','testExamNo','testFrom','testTo','testClassEntered','testClassLeft','testSubjects','testAcademic','testActivities','testPost','testAttitude','testRemarks']);
    }

    /* ------------------------------------------
       PREVIEW UPDATE
       ------------------------------------------ */
    function updatePreview() {
        if (currentDocType === 'waec') updateResultPreview('waec');
        else if (currentDocType === 'neco') updateResultPreview('neco');
        else if (currentDocType === 'testimonial') updateTestimonialPreview();
    }

    /* ------------------------------------------
       RESULT PREVIEW (WAEC + NECO)
       Both use 4-column dual-side grid.
       WAEC: includes F in summary.
       NECO: no F in summary.
       ------------------------------------------ */
    function updateResultPreview(type) {
        var doc = document.getElementById(type + 'Doc');

        setField(doc, '[data-field="name"]', document.getElementById(type + 'Name').value);
        setField(doc, '[data-field="year"]', document.getElementById(type + 'Year').value);
        setField(doc, '[data-field="examno"]', document.getElementById(type + 'ExamNo').value);
        setField(doc, '[data-field="class"]', document.getElementById(type + 'Class').value);
        setField(doc, '[data-field="cert"]', document.getElementById(type + 'CertNo').value || '');

        var today = new Date();
        setField(doc, '[data-field="date"]', today.getDate() + '/' + (today.getMonth()+1) + '/' + today.getFullYear());

        var photoData = type === 'waec' ? waecPhotoData : necoPhotoData;
        var pImg = doc.querySelector('.ov-photo-img');
        if (photoData) { pImg.src = photoData; pImg.style.display = 'block'; }
        else { pImg.style.display = 'none'; }

        /* Gather subjects from the form */
        var rows = document.querySelectorAll('#' + type + 'Subjects .subject-row');
        var subjects = [];
        var counts = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 };

        for (var i = 0; i < rows.length; i++) {
            var subj = rows[i].querySelector('input[type="text"]').value.trim();
            var grd = rows[i].querySelector('select').value;
            if (subj || grd) {
                subjects.push({ subject: subj, grade: grd });
                if (grd && GRADE_CATEGORY[grd]) counts[GRADE_CATEGORY[grd]]++;
            }
        }

        /* Build the 4-column grid table */
        var tbody = doc.querySelector('[data-field="subjects"]');
        tbody.innerHTML = '';

        var half = Math.ceil(subjects.length / 2);
        var leftCol = subjects.slice(0, half);
        var rightCol = subjects.slice(half);
        var maxRows = Math.max(leftCol.length, rightCol.length);

        for (var r = 0; r < maxRows; r++) {
            appendGridCell(tbody, 'ov-neco-subj', r < leftCol.length ? leftCol[r].subject : '');
            appendGridCell(tbody, 'ov-neco-grade', r < leftCol.length ? leftCol[r].grade : '');
            appendGridCell(tbody, 'ov-neco-subj', r < rightCol.length ? rightCol[r].subject : '');
            appendGridCell(tbody, 'ov-neco-grade', r < rightCol.length ? rightCol[r].grade : '');
        }

        /* Summary counts — WAEC includes F, NECO does not */
        setField(doc, '[data-field="count-a"]', counts.a);
        setField(doc, '[data-field="count-b"]', counts.b);
        setField(doc, '[data-field="count-c"]', counts.c);
        setField(doc, '[data-field="count-d"]', counts.d);
        setField(doc, '[data-field="count-e"]', counts.e);
        if (type === 'waec') {
            setField(doc, '[data-field="count-f"]', counts.f);
        }

        /* Update form chips */
        var summaryEl = document.getElementById(type + 'Summary');
        if (summaryEl) {
            var chips = summaryEl.querySelectorAll('.chip-value');
            for (var c = 0; c < chips.length; c++) chips[c].textContent = counts[chips[c].dataset.count] || 0;
        }
    }

    function appendGridCell(container, className, text) {
        var span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        container.appendChild(span);
    }

    /* ------------------------------------------
       TESTIMONIAL PREVIEW
       ------------------------------------------ */
    function updateTestimonialPreview() {
        var doc = document.getElementById('testimonialDoc');
        setField(doc, '[data-field="name"]', document.getElementById('testName').value);
        setField(doc, '[data-field="examno"]', document.getElementById('testExamNo').value);
        setField(doc, '[data-field="from"]', document.getElementById('testFrom').value);
        setField(doc, '[data-field="to"]', document.getElementById('testTo').value);
        setField(doc, '[data-field="class-entered"]', document.getElementById('testClassEntered').value);
        setField(doc, '[data-field="class-left"]', document.getElementById('testClassLeft').value);
        setField(doc, '[data-field="class"]', document.getElementById('testClassLeft').value);
        setField(doc, '[data-field="subjects"]', document.getElementById('testSubjects').value);
        setField(doc, '[data-field="academic"]', document.getElementById('testAcademic').value);
        setField(doc, '[data-field="activities"]', document.getElementById('testActivities').value);
        setField(doc, '[data-field="post"]', document.getElementById('testPost').value);
        setField(doc, '[data-field="attitude"]', document.getElementById('testAttitude').value);
        setField(doc, '[data-field="remarks"]', document.getElementById('testRemarks').value);
        setField(doc, '[data-field="principal"]', schoolSettings.principal || 'Principal');
        var today = new Date();
        setField(doc, '[data-field="date"]', today.getDate() + '/' + (today.getMonth()+1) + '/' + today.getFullYear());
    }

    /* ------------------------------------------
       HELPERS
       ------------------------------------------ */
    function setField(container, selector, text) {
        var el = container.querySelector(selector);
        if (el) el.textContent = text;
    }

    function getBaseUrl() {
        var h = window.location.href;
        var i = h.lastIndexOf('/');
        return i >= 0 ? h.substring(0, i + 1) : './';
    }

    function updatePreviewScale() {
        var scroll = document.getElementById('previewScroll');
        var activeDoc = null;
        var docs = document.querySelectorAll('.document-page');
        for (var i = 0; i < docs.length; i++) { if (docs[i].style.display !== 'none') { activeDoc = docs[i]; break; } }
        if (!scroll || !activeDoc) return;
        var cw = scroll.clientWidth - 48, ch = scroll.clientHeight - 48;
        var sx = cw / 793, sy = ch / 1122;
        var s = Math.min(sx, sy, 1);
        activeDoc.style.transform = 'scale(' + s + ')';
        activeDoc.style.transformOrigin = 'top center';
    }

    function cleanupPrintIframe() {
        if (printIframe) { if (printIframe.parentNode) printIframe.parentNode.removeChild(printIframe); printIframe = null; }
    }

    /* ------------------------------------------
       PRINT — IFRAME APPROACH
       ------------------------------------------ */
        window.printDocument = function () {

        /* --- Validation (unchanged) --- */
        if (currentDocType === 'waec' || currentDocType === 'neco') {
            var p = currentDocType;
            if (!document.getElementById(p+'Name').value.trim()) { showToast('Student Name is required','error'); focusField(p+'Name'); return; }
            if (!document.getElementById(p+'Year').value.trim()) { showToast('Examination Year is required','error'); focusField(p+'Year'); return; }
            if (!document.getElementById(p+'ExamNo').value.trim()) { showToast('Examination Number is required','error'); focusField(p+'ExamNo'); return; }
            if (!document.getElementById(p+'Class').value.trim()) { showToast('Class is required','error'); focusField(p+'Class'); return; }
            var rs = document.querySelectorAll('#'+p+'Subjects .subject-row'), has = false;
            for (var i=0;i<rs.length;i++) { if (rs[i].querySelector('input').value.trim()) { has=true; break; } }
            if (!has) { showToast('Enter at least one subject','error'); return; }
        } else {
            if (!document.getElementById('testName').value.trim()) { showToast('Name is required','error'); focusField('testName'); return; }
            if (!document.getElementById('testExamNo').value.trim()) { showToast('Exam Number is required','error'); focusField('testExamNo'); return; }
        }

        updatePreview();

        var activeDoc = document.getElementById(currentDocType + 'Doc');
        var tImg = activeDoc.querySelector('.template-img');
        if (!tImg.complete || tImg.naturalHeight === 0) {
            showToast('Template image not found. Place ' + currentDocType + '-template.jpeg in assets/', 'error');
            return;
        }

        var imgUrl = tImg.src;
        var cssUrl = getBaseUrl() + 'css/style.css';
        var overlayHtml = activeDoc.querySelector('.overlay').outerHTML;

        var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
        html += '<link rel="stylesheet" href="' + cssUrl + '">';
        html += '<style>';
        html += '@page{size:A4 portrait;margin:0}';
        html += '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;margin:0;padding:0;box-sizing:border-box}';
        html += 'html,body{width:210mm;height:297mm;overflow:hidden;background:#fff}';
        html += '.document-page{box-shadow:none!important;transform:none!important;margin:0!important}';
        html += '.template-placeholder{display:none!important}';
        html += '</style></head><body>';
        html += '<div class="document-page" id="' + currentDocType + 'Doc" style="display:block!important">';
        html += '<img class="template-img" src="' + imgUrl + '">';
        html += ' ' + overlayHtml;
        html += '</div></body></html>';

        cleanupPrintIframe();

        /*
         * MOBILE FIX: Printing from an iframe on mobile browsers
         * often produces a blank page.
         *
         * Solution: Open the generated HTML in a new browser tab instead.
         * Mobile browsers treat new-tab documents as standalone pages and
         * print them correctly, including background images.
         *
         * Desktop browsers continue using the iframe approach (faster, cleaner).
         */
        var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
            /* Open in a new tab, wait for image to load, then print */
            var blob = new Blob([html], { type: 'text/html' });
            var blobUrl = URL.createObjectURL(blob);

            var printWin = window.open(blobUrl, '_blank', 'width=210mm,height=297mm');

            if (!printWin) {
                showToast('Please allow pop-ups for printing', 'warning');
                setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 5000);
                return;
            }

            printWin.onload = function () {
                setTimeout(function () {
                    printWin.focus();
                    printWin.print();
                    setTimeout(function () {
                        printWin.close();
                        URL.revokeObjectURL(blobUrl);
                        cleanupPrintIframe();
                    }, 1000);
                }, 400);
            };

            printWin.onerror = function () {
                showToast('Failed to open print preview', 'error');
                URL.revokeObjectURL(blobUrl);
                cleanupPrintIframe();
            };

        } else {
            /* Desktop: use the iframe approach */
            printIframe = document.createElement('iframe');
            printIframe.style.position = 'fixed';
            printIframe.style.left = '-9999px';
            printIframe.style.top = '0';
            printIframe.style.width = '210mm';
            printIframe.style.height = '297mm';
            printIframe.style.border = 'none';
            printIframe.setAttribute('aria-hidden', 'true');
            document.body.appendChild(printIframe);

            var iWin = printIframe.contentWindow;
            var iDoc = printIframe.contentDocument || iWin.document;
            iDoc.open(); iDoc.write(html); iDoc.close();

            var iImg = iDoc.querySelector('.template-img');
            function doPrint() {
                setTimeout(function () { iWin.focus(); iWin.print(); }, 400);
            }

            if (iImg.complete && iImg.naturalHeight > 0) { doPrint(); }
            else {
                iImg.onload = doPrint;
                iImg.onerror = function () { showToast('Failed to load template image','error'); cleanupPrintIframe(); };
            }

            function onAfter() { setTimeout(cleanupPrintIframe, 500); }
            if (iWin.addEventListener) iWin.addEventListener('afterprint', onAfter);
            window.addEventListener('afterprint', onAfter);
            setTimeout(cleanupPrintIframe, 30000);
        }
    };

    /* ------------------------------------------
       CLEAR FORM
       ------------------------------------------ */
    window.clearForm = function (type) {
        if (!confirm('Are you sure you want to clear this form?')) return;
        if (type === 'waec' || type === 'neco') {
            document.getElementById(type+'Name').value = '';
            document.getElementById(type+'Year').value = '';
            document.getElementById(type+'ExamNo').value = '';
            document.getElementById(type+'Class').value = '';
            document.getElementById(type+'CertNo').value = '';
            if (type === 'waec') waecPhotoData = null; else necoPhotoData = null;
            var pb = document.getElementById(type+'PhotoPreview');
            pb.classList.remove('has-photo');
            var img = pb.querySelector('img'); if (img) img.remove();
            document.getElementById(type+'Photo').value = '';
            initDefaultSubjects(type);
        } else {
            ['testName','testExamNo','testFrom','testTo','testClassEntered','testClassLeft','testSubjects','testAcademic','testActivities','testPost','testAttitude','testRemarks'].forEach(function(id) {
                document.getElementById(id).value = '';
            });
        }
        updatePreview();
        showToast('Form cleared', 'info');
    };

    function focusField(id) {
        var el = document.getElementById(id); if (!el) return;
        el.focus(); el.style.borderColor = '#c0392b'; el.style.boxShadow = '0 0 0 3px rgba(192,57,43,0.2)';
        setTimeout(function () { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2500);
    }

    /* ------------------------------------------
       TOAST NOTIFICATIONS
       ------------------------------------------ */
    function showToast(msg, type) {
        type = type || 'info';
        var c = document.getElementById('toastContainer');
        var t = document.createElement('div'); t.className = 'toast toast-' + type; t.textContent = msg; c.appendChild(t);
        requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('show'); }); });
        setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 350); }, 3500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
