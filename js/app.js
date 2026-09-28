const supabaseUrl = 'https://qvikybnkyladsohvqobg.supabase.co';
const supabaseKey = 'sb_publishable_pme6YeHGDDBLJ3ndML8maw_EUQHhawn';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Mengubah array statis menjadi array kosong yang akan diisi dari database
let menus = [];
let cart = {};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('meja')) {
        document.getElementById('table-number').value = urlParams.get('meja');
    }
    
    // Panggil data dari database saat halaman web dibuka
    fetchMenus();
});

// Fungsi mengambil data dari Supabase
async function fetchMenus() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '<div class="text-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mx-auto mb-3"></div><p class="text-slate-500 font-medium">Memuat daftar menu...</p></div>';

    const { data, error } = await supabaseClient
        .from('menus')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });

    if (error) {
        console.error("Error fetching menus:", error);
        menuContainer.innerHTML = '<p class="text-center text-red-500 font-semibold py-10">Gagal memuat menu. Silakan refresh halaman.</p>';
        return;
    }

    menus = data;
    renderMenu();
}

function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = ''; 

    if (menus.length === 0) {
        menuContainer.innerHTML = '<p class="text-center text-slate-500 py-10 font-medium">Belum ada menu yang tersedia.</p>';
        return;
    }

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
            
            // Mengubah pemanggilan gambar menjadi menu.image_url sesuai kolom database
            sectionHTML += `
                <div class="bg-white rounded-2xl p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-all flex items-center justify-between gap-3 border border-slate-100/50">
                    <img src="${menu.image_url}" alt="${menu.name}" class="w-20 h-20 object-cover rounded-xl shadow-sm">
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
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 10);
}

window.closeConfirmationModal = function() {
    const modal = document.getElementById('confirm-modal');
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
        alert("Pesanan berhasil terkirim ke dapur!"); 
        window.location.reload();
    }
}
