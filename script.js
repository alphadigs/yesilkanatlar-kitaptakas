// Navbar scroll effect, modal controls, and interactive animations
// Backend API URL
yesilkanatlar-kitaptakas-production.up.railway.app;

window.addEventListener('DOMContentLoaded', () => {
    // Navbar shrink on scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if(window.scrollY > 40) {
            navbar.style.boxShadow = '0 8px 32px rgba(67,160,71,0.18)';
        } else {
            navbar.style.boxShadow = 'var(--shadow)';
        }
    });

    // Modal controls for kitap ekle
    const addBookBtn = document.getElementById('addBookBtn');
    const bookModal = document.getElementById('bookModal');
    const closeModal = document.getElementById('closeModal');
    if(addBookBtn && bookModal && closeModal) {
        addBookBtn.onclick = () => bookModal.classList.add('active');
        closeModal.onclick = () => bookModal.classList.remove('active');
        window.onclick = (e) => { if(e.target === bookModal) bookModal.classList.remove('active'); };
    }

    // Explore button scroll
    const exploreBtn = document.getElementById('exploreBtn');
    if(exploreBtn) {
        exploreBtn.onclick = () => {
            window.location.href = 'kitaplar.html';
        };
    }

    // Kitap ekleme formu ve kitapları listeleme (API bağlantılı)
    const bookForm = document.getElementById('bookForm');
    const booksList = document.getElementById('booksList');
    if(bookForm && booksList) {
        // Kitap ekle
        bookForm.onsubmit = async (e) => {
            e.preventDefault();
            const [ad, yazar, kategori, yil, aciklama, gorsel, tur] = bookForm.elements;
            const formData = new FormData();
            formData.append('title', ad.value);
            formData.append('author', yazar.value);
            formData.append('category', kategori.value);
            formData.append('year', yil.value);
            formData.append('description', aciklama.value);
            formData.append('type', tur.value);
            if(gorsel.files[0]) formData.append('image', gorsel.files[0]);
            const res = await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: formData
            });
            const data = await res.json();
            if(data.id) {
                bookModal.classList.remove('active');
                bookForm.reset();
                loadBooks();
            } else {
                alert(data.error || 'Kitap eklenemedi!');
            }
        };
        // Kitapları yükle
        async function loadBooks() {
            booksList.innerHTML = '<div>Yükleniyor...</div>';
            const res = await fetch(`${API_URL}/books`);
            const books = await res.json();
            booksList.innerHTML = '';
            // Sepet bilgisi için önce oturum açan kullanıcının sepetini al
            let basket = [];
            if(localStorage.getItem('token')) {
                const userRes = await fetch(`${API_URL}/me`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
                const userData = await userRes.json();
                basket = userData.basket || [];
            }
            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                const inBasket = basket.includes(book.id);
                card.innerHTML = `
                    <img src="${book.image ? 'http://localhost:3001'+book.image : 'https://via.placeholder.com/100x140'}" alt="Kitap Görseli">
                    <h3>${book.title}</h3>
                    <p><b>Yazar:</b> ${book.author}</p>
                    <p><b>Kategori:</b> ${book.category}</p>
                    <p><b>Yıl:</b> ${book.year}</p>
                    <p><b>Tür:</b> ${book.type}</p>
                    <p>${book.description}</p>
                    <p><b>Ekleyen:</b> ${book.username}</p>
                    <button class="msg-btn" data-uid="${book.user_id}" data-username="${book.username}">Mesaj Gönder</button>
                    <button class="basket-btn" data-bookid="${book.id}">${inBasket ? 'Sepetten Çıkar' : 'Sepete Ekle'}</button>
                `;
                booksList.appendChild(card);
            });
            // Mesajlaşma butonları
            document.querySelectorAll('.msg-btn').forEach(btn => {
                btn.onclick = () => openMsgModal(btn.dataset.uid, btn.dataset.username);
            });
            // Sepet butonları
            document.querySelectorAll('.basket-btn').forEach(btn => {
                btn.onclick = async () => {
                    if(!localStorage.getItem('token')) { alert('Sepete eklemek için giriş yapmalısınız!'); return; }
                    const bookId = parseInt(btn.dataset.bookid);
                    const action = btn.textContent.includes('Çıkar') ? 'remove' : 'add';
                    const res = await fetch(`${API_URL}/basket`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                        body: JSON.stringify({ book_id: bookId, action })
                    });
                    if(res.ok) loadBooks();
                };
            });
            // Mesajlaşma butonları
            document.querySelectorAll('.msg-btn').forEach(btn => {
                btn.onclick = () => openMsgModal(btn.dataset.uid, btn.dataset.username);
            });
        }
        loadBooks();
    }

    // Giriş/Kayıt butonu
    const loginBtn = document.getElementById('loginBtn');
    if(loginBtn) {
        loginBtn.onclick = () => {
            window.location.href = 'login.html';
        };
    }

    // Login/Register sayfası entegrasyonu
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const registerCard = document.getElementById('registerCard');
    if(showRegister && registerCard) {
        showRegister.onclick = () => {
            document.querySelector('.login-card').style.display = 'none';
            registerCard.style.display = 'block';
        };
    }
    if(showLogin) {
        showLogin.onclick = () => {
            registerCard.style.display = 'none';
            document.querySelector('.login-card').style.display = 'block';
        };
    }
    if(loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const [email, password] = loginForm.elements;
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.value, password: password.value })
            });
            const data = await res.json();
            if(data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                window.location.href = 'kitaplar.html';
            } else {
                alert(data.error || 'Giriş başarısız!');
            }
        };
    }
    if(registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const [username, email, password] = registerForm.elements;
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.value, email: email.value, password: password.value })
            });
            const data = await res.json();
            if(data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                window.location.href = 'kitaplar.html';
            } else {
                alert(data.error || 'Kayıt başarısız!');
            }
        };
    }

    // Oturum kontrolü ve kullanıcı adı gösterimi (navbar)
    const username = localStorage.getItem('username');
    if(username) {
        const navLinks = document.querySelector('.nav-links');
        if(navLinks) {
            let userLi = document.createElement('li');
            userLi.innerHTML = `<span style="color:var(--accent)"><b>${username}</b></span> <a href="#" id="logoutBtn">Çıkış</a>`;
            navLinks.appendChild(userLi);
            const logoutBtn = document.getElementById('logoutBtn');
            if(logoutBtn) {
                logoutBtn.onclick = () => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    window.location.reload();
                };
            }
        }
    }

    // İletişim formu (dummy)
    const contactForm = document.querySelector('.contact-form');
    if(contactForm) {
        contactForm.onsubmit = (e) => {
            e.preventDefault();
            alert('Mesajınız başarıyla gönderildi!');
            contactForm.reset();
        };
    }

    // Mesajlaşma modalı
    let msgModal;
    function openMsgModal(toUserId, toUsername) {
        if(document.getElementById('msgModal')) document.getElementById('msgModal').remove();
        msgModal = document.createElement('div');
        msgModal.className = 'modal active';
        msgModal.id = 'msgModal';
        msgModal.innerHTML = `
            <div class="modal-content">
                <span class="close" id="closeMsgModal">&times;</span>
                <h2>${toUsername} ile Mesajlaş</h2>
                <div id="messagesBox" style="max-height:200px;overflow-y:auto;margin-bottom:10px;"></div>
                <form id="msgForm">
                    <input type="text" placeholder="Mesajınız" required style="width:80%">
                    <button type="submit">Gönder</button>
                </form>
            </div>
        `;
        document.body.appendChild(msgModal);
        document.getElementById('closeMsgModal').onclick = () => msgModal.remove();
        // Mesajları yükle
        async function loadMessages() {
            const res = await fetch(`${API_URL}/messages/${toUserId}`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            const msgs = await res.json();
            const box = document.getElementById('messagesBox');
            box.innerHTML = msgs.map(m => `<div style="margin-bottom:8px;"><b>${m.from_user == getUserId() ? 'Siz' : toUsername}:</b> ${m.content}</div>`).join('');
            box.scrollTop = box.scrollHeight;
        }
        // Kullanıcı ID'sini almak için token decode
        function getUserId() {
            const token = localStorage.getItem('token');
            if(!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        }
        loadMessages();
        // Mesaj gönder
        document.getElementById('msgForm').onsubmit = async (e) => {
            e.preventDefault();
            const input = e.target.elements[0];
            const res = await fetch(`${API_URL}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ to_user: toUserId, content: input.value })
            });
            input.value = '';
            await loadMessages();
        };
    }
});
