const supabaseUrl = 'https://qvikybnkyladsohvqobg.supabase.co';
const supabaseKey = 'sb_publishable_pme6YeHGDDBLJ3ndML8maw_EUQHhawn';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const menus = [
    { id: 1, name: 'Nasi Goreng Spesial', price: 25000, category: 'Makanan Utama', img: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=200&q=80' },
    { id: 2, name: 'Mie Goreng Ayam', price: 20000, category: 'Makanan Utama', img: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=200&q=80' },
    { id: 3, name: 'Es Teh Manis', price: 5000, category: 'Minuman Segar', img: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=200&q=80' },
    { id: 4, name: 'Jus Jeruk', price: 12000, category: 'Minuman Segar', img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=200&q=80' },
    { id: 5, name: 'Sambal Terasi', price: 3000, category: 'Tambahan', img: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=200&q=80' },
    { id: 6, name: 'Kerupuk Udang', price: 2000, category: 'Tambahan', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=200&q=80' }
];

let cart = {};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('meja')) {
        document.getElementById('table-number').value = urlParams.get('meja');
    }
    renderMenu();
});

function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = ''; 

    const categories = [...new Set(menus.map(item => item.category))];

    categories.forEach(category => {
        let sectionHTML = `
            <div class="mb-8">
                <h2 class="text-lg font-bold text-slate-800 mb-4 pl-1 border-l-4 border-orange-500 rounded-sm">${category}</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        `;

        const categoryMenus = menus.filter(menu => menu.category === category);
        categoryMenus.forEach(menu => {
            cart[menu.id] = 0; 
            
            // Desain Card Modern
            sectionHTML += `
                <div class="bg-white rounded-2xl p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-all flex items-center justify-between gap-3 border border-slate-100/50">
                    <img src="${menu.img}" alt="${menu.name}" class="w-20 h-20 object-cover rounded-xl shadow-sm">
                    <div class="flex-1 py-1">
                        <h3 class="font-semibold text-slate-800 leading-tight mb-1 text-sm md:text-base">${menu.name}</h3>
                        <p class="text-orange-500 font-bold text-sm">Rp ${menu.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div class="flex flex-col items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button onclick="updateCart(${menu.id}, 1)" class="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-orange-500 font-bold shadow-sm hover:bg-orange-50 transition">+</button>
                        <span id="qty-${menu.id}" class="font-semibold w-7 text-center text-sm text-slate-700">0</span>
                        <button onclick="updateCart(${menu.id}, -1)" class="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-500 font-bold shadow-sm hover:bg-slate-50 transition">-</button>
                    </div>
                </div>
            `;
        });

        sectionHTML += `</div></div>`;
        menuContainer.innerHTML += sectionHTML;
    });
}

window.updateCart = function(id, change) {
    if (cart[id] + change >= 0) {
        cart[id] += change;
        document.getElementById(`qty-${id}`).innerText = cart[id];
        calculateTotal();
    }
}

function calculateTotal() {
    let total = 0;
    menus.forEach(menu => {
        total += cart[menu.id] * menu.price;
    });
    document.getElementById('total-price').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    return total;
}

window.showConfirmationModal = function() {
    const customerName = document.getElementById('customer-name').value.trim();
    const total = calculateTotal();

    if (!customerName) {
        alert("Mohon masukkan nama pemesan terlebih dahulu.");
        document.getElementById('customer-name').focus();
        return;
    }
    if (total === 0) {
        alert("Silakan pilih minimal 1 menu sebelum memesan.");
        return;
    }

    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('hidden');
    // Efek transisi masuk
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 10);
}

window.closeConfirmationModal = function() {
    const modal = document.getElementById('confirm-modal');
    // Efek transisi keluar
    modal.classList.add('opacity-0');
    modal.children[0].classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

window.processOrder = async function() {
    closeConfirmationModal();
    
    const customerName = document.getElementById('customer-name').value.trim();
    const tableNumber = document.getElementById('table-number').value.trim() || 'Bawa Pulang';
    const total = calculateTotal();

    const orderedItems = menus
        .filter(menu => cart[menu.id] > 0)
        .map(menu => ({
            id: menu.id,
            name: menu.name,
            qty: cart[menu.id],
            price: menu.price,
            subtotal: cart[menu.id] * menu.price
        }));

    const payload = {
        customer_name: customerName,
        table_number: tableNumber,
        items: orderedItems,
        total_price: total,
        status: 'pending'
    };

    document.getElementById('loading').classList.remove('hidden');

    const { data, error } = await supabaseClient
        .from('orders')
        .insert([payload]);

    document.getElementById('loading').classList.add('hidden');

    if (error) {
        console.error("Supabase Error:", error);
        alert("Gagal mengirim pesanan. Periksa koneksi internet Anda.");
    } else {
        // Notifikasi sukses yang lebih mulus (bisa diganti SweetAlert nanti jika mau)
        alert("Pesanan berhasil terkirim ke dapur!"); 
        window.location.reload();
    }
}
