let db;
const DB_NAME = 'CRM_Database';
const DB_VERSION = 1;
const STORE_NAME = 'clients';

const form = document.getElementById('client-form');
const addBtn = document.getElementById('add-btn');
const clientList = document.getElementById('client-list');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');

let editingId = null;

// --- Regex ---
const nameRegex  = /^[A-Za-zÀ-ÖØ-öø-ÿñÑ\s]{2,60}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+\d]?(?:[\d\s\-().]){7,20}$/;

// --- Abrir IndexedDB y crear object store si hace falta
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
            objectStore.createIndex('email', 'email', { unique: true }); // email único
            objectStore.createIndex('phone', 'phone', { unique: false });
        }
    };
}

// --- Validaciones en blur
function validateField(input) {
    const val = input.value.trim();
    let ok = false;
    if (input === nameInput) ok = nameRegex.test(val);
    if (input === emailInput) ok = emailRegex.test(val);
    if (input === phoneInput) ok = phoneRegex.test(val);

    input.classList.remove('valid','invalid');

    if (val === '') {
        input.classList.add('invalid');
        return false;
    }
    if (ok) {
        input.classList.add('valid');
        return true;
    } else {
        input.classList.add('invalid');
        return false;
    }
}

function enableButtonIfValid() {
    const allValid = [nameInput, emailInput, phoneInput].every(inp => inp.classList.contains('valid'));
    addBtn.disabled = !allValid;
    addBtn.textContent = editingId ? 'Guardar Cambios' : 'Agregar Cliente';
}

// --- Añadir listeners blur y input para actualizar estado
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

// --- Submit: agregar o actualizar
form.addEventListener('submit', function(e) {
    e.preventDefault();
    // última validación
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

// --- Agregar cliente (verificando emaiel)
function addClient(client) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('email');

    // --- comprobar si email ya existe
    const check = index.get(client.email);
    check.onsuccess = function() {
        if (check.result) {

            emailInput.classList.remove('valid');
            emailInput.classList.add('invalid');
            enableButtonIfValid();
            alert('El email ya está registrado. Usa otro email o edita ese contacto.');
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
        alert('Error al comprobar email. Revisa la consola.');
    };
}

// --- Actualizar cliente
function updateClient(id, client) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('email');


    const getReq = store.get(id);
    getReq.onsuccess = function() {
        const original = getReq.result;
        if (!original) {
            alert('No se encontró el registro a editar.');
            resetForm();
            fetchClients();
            return;
        }

        if (original.email !== client.email) {
            const check = index.get(client.email);
            check.onsuccess = function() {
                if (check.result) {
                    alert('Ese email ya pertenece a otro cliente.');
                    emailInput.classList.remove('valid');
                    emailInput.classList.add('invalid');
                    enableButtonIfValid();
                    return;
                }

                const updated = { ...client, id: id };
                const putReq = store.put(updated);
                putReq.onsuccess = function() {
                    resetForm();
                    fetchClients();
                };
                putReq.onerror = function(e) {
                    console.error('Error actualizando', e);
                    alert('Error al actualizar. Revisa la consola.');
                };
            };
            check.onerror = function(e) {
                console.error('Error comprobando email', e);
                alert('Error comprobando email.');
            };
        } else {

            const updated = { ...client, id: id };
            const putReq = store.put(updated);
            putReq.onsuccess = function() {
                resetForm();
                fetchClients();
            };
            putReq.onerror = function(e) {
                console.error('Error actualizando', e);
                alert('Error al actualizar. Revisa la consola.');
            };
        }
    };
    getReq.onerror = function(e) {
        console.error('Error leyendo original', e);
        alert('Error al leer registro original.');
    };
}

// --- Eliminar cliente
window.deleteClient = function(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const del = store.delete(id);
    del.onsuccess = function() {
        fetchClients();
    };
    del.onerror = function(e) {
        console.error('Error eliminando', e);
        alert('Error al eliminar cliente.');
    };
};


window.editClient = function(id) {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = function() {
        const client = req.result;
        if (!client) {
            alert('Cliente no encontrado.');
            return;
        }
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
    req.onerror = function(e) {
        console.error('Error al obtener cliente', e);
        alert('Error al obtener cliente.');
    };
};

// --- Leer y mostrar clientes
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
        }
    };
    req.onerror = function(e) {
        console.error('Error leyendo clientes', e);
        alert('Error al leer clientes.');
    };
}

// --- Helpers
function resetForm() {
    form.reset();
    editingId = null;
    [nameInput, emailInput, phoneInput].forEach(i => i.classList.remove('valid','invalid'));
    addBtn.disabled = true;
    addBtn.textContent = 'Agregar Cliente';
}

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


openDatabase();
