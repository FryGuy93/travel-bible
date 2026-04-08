// 1. PROJECT DETAILS
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
    // Normalise the text: handle "Shop" vs "shop" and remove hidden spaces from CSVs
    const cat = category ? category.toLowerCase().trim() : 'other';

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

// 4. FETCH AND DRAW PINS
async function loadBibleEntries() {
    // We use .range(0, 5000) to ensure we get ALL records, not just the first 1000
    const { data: entries, error } = await _supabase
        .from('travel_bible')
        .select('*')
        .eq('archived', false)
        .range(0, 5000); 

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    // Object to store our category groups for the toggle menu
    const categoryLayers = {};

    entries.forEach(entry => {
        // Fallback for lon/lng naming just in case the CSV used 'lng'
        const longitude = entry.lon || entry.lng;

        if (entry.lat && longitude) {
            const markerIcon = createCustomMarker(entry.category);
            
            const marker = L.marker([entry.lat, longitude], { icon: markerIcon })
                .bindPopup(`<b>${entry.name}</b><br><i>${entry.category}</i>`);

            // Use the category name (trimmed) for the grouping
            const catName = entry.category ? entry.category.trim() : 'Other';

            // If the layer group for this category doesn't exist, create it
            if (!categoryLayers[catName]) {
                categoryLayers[catName] = L.layerGroup().addTo(map);
            }

            // Add the marker to its specific category layer
            marker.addTo(categoryLayers[catName]);
        }
    });

    // 5. ADD THE TOGGLE CONTROL (Top Right)
    // This creates the checkboxes based on the categories found in your data
    L.control.layers(null, categoryLayers, { collapsed: false }).addTo(map);
}

// Start the process
loadBibleEntries();
