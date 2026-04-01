// 1. PROJECT DETAILS (Insert your specific details here)
const supabaseUrl = 'https://toasrijwkbetfmbhjgoe.supabase.co'; 
const supabaseKey = 'sb_publishable_Z6xbir2JKD6Xf-BRx9mqXQ_K8EJxE0L';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. INITIALISE MAP (Centred on Hastings)
const map = L.map('map').setView([50.85, 0.57], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 3. ICON GENERATOR FUNCTION
function createCustomMarker(category) {
    // Normalise the text (Handle Title Case, spaces, etc.)
    const cat = category ? category.toLowerCase().trim() : 'other';

    // Map your categories to Icons, Colours, and Shapes
    const configs = {
        attraction: { icon: 'fa-star', markerColor: 'violet', shape: 'circle' },
        park:       { icon: 'fa-tree', markerColor: 'green', shape: 'circle' },
        property:   { icon: 'fa-house', markerColor: 'black', shape: 'square' },
        restaurant: { icon: 'fa-utensils', markerColor: 'red', shape: 'circle' },
        shop:       { icon: 'fa-cart-shopping', markerColor: 'blue', shape: 'square' },
        poi:        { icon: 'fa-eye', markerColor: 'orange', shape: 'star' },
        town:       { icon: 'fa-city', markerColor: 'yellow', shape: 'square' },
        transport:  { icon: 'fa-train', markerColor: 'cyan', shape: 'circle' },
        other:      { icon: 'fa-question', markerColor: 'blue-dark', shape: 'circle' }
    };

    const config = configs[cat] || configs.other;

    return L.ExtraMarkers.icon({
        icon: config.icon,
        markerColor: config.markerColor,
        shape: config.shape,
        prefix: 'fa'
    });
}

// 4. FETCH AND DRAW 399 PINS
async function loadBibleEntries() {
    const { data: entries, error } = await _supabase
        .from('travel_bible')
        .select('*')
        .eq('archived', false);

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    entries.forEach(entry => {
        if (entry.lat && entry.lon) {
            // Assign the icon based on category
            const markerIcon = createCustomMarker(entry.category);

            L.marker([entry.lat, entry.lon], { icon: markerIcon })
                .addTo(map)
                .bindPopup(`<b>${entry.name}</b><br><i>${entry.category}</i>`);
        }
    });
}

// Start the process
loadBibleEntries();