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

// 4. FETCH AND DRAW PINS WITH CATEGORY FILTERING
async function loadBibleEntries() {
    // We fetch a larger range to get past the default 1000 limit
    const { data: entries, error } = await _supabase
        .from('travel_bible')
        .select('*')
        .eq('archived', false)
        .range(0, 5000); // Increased range for 1000+ records

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    // This object will hold our category groups
    const categoryLayers = {};

    entries.forEach(entry => {
        if (entry.lat && entry.lon) {
            const markerIcon = createCustomMarker(entry.category);
            
            const marker = L.marker([entry.lat, entry.lon], { icon: markerIcon })
                .bindPopup(`<b>${entry.name}</b><br><i>${entry.category}</i>`);

            // Check if we already have a layer for this category
            const catName = entry.category || 'other';
            if (!categoryLayers[catName]) {
                // Create a new layer group and add it to the map immediately
                categoryLayers[catName] = L.layerGroup().addTo(map);
            }

            // Add the marker to its category group instead of directly to the map
            marker.addTo(categoryLayers[catName]);
        }
    });

    // 5. ADD TOGGLE CONTROL
    // This creates the list of checkboxes in the top right corner
    L.control.layers(null, categoryLayers, {
        collapsed: false // Set to true if you want it to be a small icon instead of a list
    }).addTo(map);
}

// Start the process
loadBibleEntries();
