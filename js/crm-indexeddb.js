let db;
const DB_NAME = 'CRM_Database';
const DB_VERSION = 1;
const STORE_NAME = 'clients';

const form = document.getElementById('client-form');
const addBtn = document.getElementById('add-btn');
const clientList = document.getElementById('client-list');
const searchInput = document.getElementById('search');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');

let editingId = null;

// Regex
const nameRegex  = /^[A-Za-zÀ-ÖØ-öø-ÿñÑ\s]{2,60}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+\d]?(?:[\d\s\-().]){7,20}$/;

// Abrir IndexedDB
function openDatabase() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function(event) {
        console.error('Error abriendo IndexedDB', event);
        alert('Error accediendo a IndexedDB. Revisa la consola.');
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        fetchClients();
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('email', 'email', { unique: true });
            objectStore.createIndex('phone', 'phone', { unique: false });
        }
    };
}

// Mensajes de validación
function showMessage(input, message, isValid) {
    let msg = input.nextElementSibling;
    if (!msg || !msg.classList.contains('small-note')) {
        msg = document.createElement('div');
        msg.className = 'small-note';
        input.insertAdjacentElement('afterend', msg);
    }
    msg.textContent = message;
    msg.style.color = isValid ? '#28a745' : '#dc3545';
}

// Validaciones
function validateField(input) {
    const val = input.value.trim();
    let ok = false;
    let msg = '';
    if (input === nameInput) {
        ok = nameRegex.test(val);
        msg = ok ? 'Nombre válido' : 'El nombre debe tener solo letras y espacios, 2-60 caracteres';
    }
    if (input === emailInput) {
        ok = emailRegex.test(val);
        msg = ok ? 'Email válido' : 'Email no válido (ej: ejemplo@dominio.com)';
    }
    if (input === phoneInput) {
        ok = phoneRegex.test(val);
        msg = ok ? 'Teléfono válido' : 'Teléfono no válido (ej: 123-456-7890)';
    }

    input.classList.remove('valid','invalid');

    if (val === '') {
        input.classList.add('invalid');
        showMessage(input, 'Campo obligatorio', false);
        return false;
    }

    if (ok) {
        input.classList.add('valid');
        showMessage(input, msg, true);
        return true;
    } else {
        input.classList.add('invalid');
        showMessage(input, msg, false);
        return false;
    }
}

function enableButtonIfValid() {
    const allValid = [nameInput, emailInput, phoneInput].every(inp => inp.classList.contains('valid'));
    addBtn.disabled = !allValid;
    addBtn.textContent = editingId ? 'Guardar Cambios' : 'Agregar Cliente';
}

// Listeners para inputs
[nameInput, emailInput, phoneInput].forEach(input => {
    input.addEventListener('blur', () => {
        validateField(input);
        enableButtonIfValid();
    });
    input.addEventListener('input', () => {
        if (input.classList.contains('invalid') || input.classList.contains('valid')) {
            validateField(input);
            enableButtonIfValid();
        }
    });
});

// Form submit
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const v1 = validateField(nameInput);
    const v2 = validateField(emailInput);
    const v3 = validateField(phoneInput);
    enableButtonIfValid();
    if (!(v1 && v2 && v3)) return;

    const clientObj = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
    };

    if (editingId) {
        updateClient(editingId, clientObj);
    } else {
        addClient(clientObj);
    }
});

// Añadir cliente
function addClient(client) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('email');

    const check = index.get(client.email);
    check.onsuccess = function() {
        if (check.result) {
            emailInput.classList.remove('valid');
            emailInput.classList.add('invalid');
            enableButtonIfValid();
            showMessage(emailInput, 'El email ya está registrado', false);
            return;
        }
        const addReq = store.add(client);
        addReq.onsuccess = function() {
            resetForm();
            fetchClients();
        };
        addReq.onerror = function(event) {
            console.error('Error añadiendo cliente', event);
            alert('Error al añadir cliente. Revisa la consola.');
        };
    };
    check.onerror = function(e) {
        console.error('Error comprobando email', e);
    };
}


// Actualizar cliente
function updateClient(id, client) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('email');

    const getReq = store.get(id);
    getReq.onsuccess = function() {
        const original = getReq.result;
        if (!original) { resetForm(); fetchClients(); return; }

        if (original.email !== client.email) {
            const check = index.get(client.email);
            check.onsuccess = function() {
                if (check.result) {
                    showMessage(emailInput, 'Ese email ya pertenece a otro cliente', false);
                    emailInput.classList.remove('valid');
                    emailInput.classList.add('invalid');
                    enableButtonIfValid();
                    return;
                }
                putClient(store, client, id);
            };
            check.onerror = function(e) { console.error(e); };
        } else {
            putClient(store, client, id);
        }
    };
    getReq.onerror = function(e) { console.error(e); };
}

function putClient(store, client, id) {
    const updated = { ...client, id: id };
    const putReq = store.put(updated);
    putReq.onsuccess = function() {
        resetForm();
        fetchClients();
    };
    putReq.onerror = function(e) { console.error(e); };
}

// Eliminar cliente
window.deleteClient = function(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const del = store.delete(id);
    del.onsuccess = function() { fetchClients(); };
    del.onerror = function(e) { console.error(e); };
};

// Editar cliente
window.editClient = function(id) {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = function() {
        const client = req.result;
        if (!client) return;
        editingId = id;
        nameInput.value = client.name;
        emailInput.value = client.email;
        phoneInput.value = client.phone;

        [nameInput, emailInput, phoneInput].forEach(i => {
            i.classList.remove('invalid');
            i.classList.add('valid');
        });
        enableButtonIfValid();
        nameInput.focus();
    };
};

// Leer y mostrar clientes
function fetchClients() {
    clientList.innerHTML = '';
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    const fragment = document.createDocumentFragment();

    req.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const client = cursor.value;
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.innerHTML = `<strong>${escapeHtml(client.name)}</strong> — ${escapeHtml(client.email)} — ${escapeHtml(client.phone)}`;
            li.appendChild(span);

            const actions = document.createElement('div');
            actions.className = 'actions';
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.type = 'button';
            editBtn.addEventListener('click', () => window.editClient(client.id));
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Eliminar';
            delBtn.type = 'button';
            delBtn.addEventListener('click', () => window.deleteClient(client.id));

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);
            li.appendChild(actions);

            fragment.appendChild(li);
            cursor.continue();
        } else {
            if (!fragment.childElementCount) {
                const li = document.createElement('li');
                li.textContent = 'No hay clientes registrados.';
                fragment.appendChild(li);
            }
            clientList.appendChild(fragment);
            filterClients();
        }
    };
}

// Reset form
function resetForm() {
    form.reset();
    editingId = null;
    [nameInput, emailInput, phoneInput].forEach(i => {
        i.classList.remove('valid','invalid');
        const msg = i.nextElementSibling;
        if (msg && msg.classList.contains('small-note')) {
            msg.textContent = '';
        }
    });
    addBtn.disabled = true;
    addBtn.textContent = 'Agregar Cliente';
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"'`=\/]/g, function(s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '`': '&#96;',
            '=': '&#61;',
            '/': '&#47;'
        })[s];
    });
}

// Búsqueda en tiempo real
function filterClients() {
    const term = searchInput.value.trim().toLowerCase();
    Array.from(clientList.children).forEach(li => {
        const text = li.querySelector('span').textContent.toLowerCase();
        li.style.display = text.includes(term) ? '' : 'none';
    });
}

searchInput.addEventListener('input', filterClients);

// Exportar clientes
exportBtn.addEventListener('click', () => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
        const data = req.result;
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clientes.json';
        a.click();
        URL.revokeObjectURL(url);
    };
});

// Importar clientes
importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const clients = JSON.parse(evt.target.result);
            clients.forEach(client => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const index = store.index('email');
                const check = index.get(client.email);
                check.onsuccess = function() {
                    if (!check.result) store.add({name: client.name, email: client.email, phone: client.phone});
                };
            });
            setTimeout(fetchClients, 300);
            alert('Clientes importados correctamente.');
        } catch (err) {
            alert('Archivo JSON inválido.');
            console.error(err);
        }
    };
    reader.readAsText(file);
});


openDatabase();
