// 1. PROJECT DETAILS
const supabaseUrl = 'https://toasrijwkbetfmbhjgoe.supabase.co'; 
const supabaseKey = 'sb_publishable_Z6xbir2JKD6Xf-BRx9mqXQ_K8EJxE0L';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. INITIALISE MAP
const map = L.map('map').setView([50.85, 0.57], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 3. STORAGE FOR CLUSTERS AND CATEGORIES
// We store Cluster Groups in an object so we can toggle them by category
const categoryClusters = {}; 

// 4. ICON GENERATOR
function createCustomMarker(category, id) {
    let cat = category ? category.toLowerCase().trim() : 'other';
    
    if (cat === 'other' && id) {
        if (id.startsWith('ATT')) cat = 'attraction';
        if (id.startsWith('SHO')) cat = 'shop';
    }

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

// 5. THE MEGA-FETCHER (Recursive up to 100,000 rows)
async function loadBibleEntries() {
    let allEntries = [];
    let from = 0;
    const step = 1000;
    let fetching = true;

    console.log("🚀 Starting mega-fetch for 100,000 potential pins...");

    while (fetching) {
        const { data, error } = await _supabase
            .from('travel_bible')
            .select('id, name, lat, lon, category, sub_category')
            .range(from, from + step - 1);

        if (error) {
            console.error("Fetch error:", error.message);
            fetching = false;
            break;
        }

        if (data.length === 0) {
            fetching = false;
        } else {
            allEntries = allEntries.concat(data);
            console.log(`Fetched ${allEntries.length} pins...`);
            from += step;
            
            // Limit to 100k for safety
            if (allEntries.length >= 100000) fetching = false;
        }
    }

    processPins(allEntries);
}

// 6. PROCESS AND CLUSTER
function processPins(entries) {
    entries.forEach(entry => {
        if (entry.lat && entry.lon) {
            
            // --- CLEANING THE DISPLAY NAME ---
            let rawCat = entry.category ? entry.category.trim() : 'Uncategorised';
            
            // Standard formatting: "food" -> "Food", "poi" -> "POI"
            let catName;
            if (rawCat.toLowerCase() === 'poi') {
                catName = 'POI'; 
            } else {
                catName = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
            }

            // Optional: Marketing renames (change these to suit your brand)
            if (catName === 'Shop') catName = 'Shops';
            if (catName === 'Poi') catName = 'Points of Interest';

            // --- CLUSTERING LOGIC ---
            // Create a Marker Cluster Group for this category if it doesn't exist
            if (!categoryClusters[catName]) {
                categoryClusters[catName] = L.markerClusterGroup({
                    showCoverageOnHover: false,
                    maxClusterRadius: 50, // Adjust this (higher = more clustering)
                    disableClusteringAtZoom: 18 // Pins split when you zoom in very close
                }).addTo(map);
            }

            // Generate the icon using your Section 3 function
            const markerIcon = createCustomMarker(entry.category, entry.id);
            
            // Create the marker
            const marker = L.marker([entry.lat, entry.lon], { icon: markerIcon })
                .bindPopup(`
                    <div style="line-height:1.5;">
                        <strong style="font-size:1.2em;">${entry.name}</strong><br>
                        <span style="color:#555; font-weight:bold;">${catName}</span>
                        ${entry.sub_category ? `<br><span style="color:#777;">${entry.sub_category}</span>` : ''}
                        <hr style="margin:8px 0; border:0; border-top:1px solid #eee;">
                        <small style="color:#bbb;">Reference: ${entry.id}</small>
                    </div>
                `);
            
            // Add the marker to the correct category's cluster group
            categoryClusters[catName].addLayer(marker);
        }
    });

    // Once all pins are processed, draw the filter UI
    createFilterUI();
}

// 7. DYNAMIC FILTER UI
function createFilterUI() {
    const existingMenu = document.querySelector('.filter-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'filter-menu';
    Object.assign(menu.style, {
        position: 'absolute', top: '10px', right: '10px', zIndex: '1000',
        background: 'white', padding: '12px', borderRadius: '8px',
        boxShadow: '0 2px 15px rgba(0,0,0,0.3)', fontFamily: 'Arial',
        maxHeight: '80vh', overflowY: 'auto', minWidth: '150px'
    });

    menu.innerHTML = '<h3 style="margin:0 0 10px 0; font-size:16px;">Categories</h3>';

    Object.keys(categoryClusters).sort().forEach(cat => {
        const div = document.createElement('div');
        div.style.marginBottom = '8px';
        
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.id = `chk-${cat}`;
        cb.style.marginRight = '10px';

        cb.onchange = (e) => {
            if (e.target.checked) map.addLayer(categoryClusters[cat]);
            else map.removeLayer(categoryClusters[cat]);
        };

        const lbl = document.createElement('label');
        lbl.htmlFor = `chk-${cat}`;
        lbl.innerText = cat;
        lbl.style.cursor = 'pointer';

        div.appendChild(cb);
        div.appendChild(lbl);
        menu.appendChild(div);
    });

    document.body.appendChild(menu);
}

// Init
loadBibleEntries();