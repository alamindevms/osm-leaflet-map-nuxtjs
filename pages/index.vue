<template>
  <div class="relative">
    <div id="map" class="h-[calc(100vh-70px)]"></div>
    <div
      class="absolute top-5 left-5 bottom-5 z-[999] bg-white rounded-lg p-4 shadow w-80 flex flex-col overflow-hidden"
    >
      <!-- tabs -->
      <div class="flex gap-2 mb-4">
        <button
          @click="toggleTab('search')"
          :class="[
            activeTab === 'search' ? 'bg-sky-200 text-sky-800' : '',
            'flex-1 bg-gray-50 p-2 rounded-lg text-center text-gray-500 hover:text-sky-500 hover:bg-sky-100',
          ]"
        >
          Search
        </button>
        <button
          @click="toggleTab('direction')"
          :class="[
            activeTab === 'direction' ? 'bg-sky-200 text-sky-800' : '',
            'flex-1 bg-gray-50 p-2 rounded-lg text-center text-gray-500 hover:text-sky-500 hover:bg-sky-100',
          ]"
        >
          Direction
        </button>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- search -->
        <template v-if="activeTab === 'search'">
          <div>
            <input
              type="search"
              @input="handleSearch"
              placeholder="Search location"
              class="w-full h-12 border border-gray-200 rounded-lg px-4"
            />
          </div>

          <div class="relative flex-1 overflow-hidden">
            <div
              v-if="isLoading"
              class="absolute top-10 left-0 right-0 bg-white/50 h-96 flex justify-center items-center"
            >
              <span class="loader"></span>
            </div>
            <ul
              class="mt-2 space-y-2 divide-y divide-gray-200 h-full overflow-y-auto"
              v-if="suggestions?.length > 0"
            >
              <li
                v-for="suggestion in suggestions"
                :key="suggestion"
                class="p-2 bg-gray-50 rounded-lg cursor-pointer"
                @click="
                  selectLocation({
                    latitude: suggestion.lat,
                    longitude: suggestion.lon,
                  })
                "
              >
                {{ suggestion?.display_name }}
              </li>
            </ul>
          </div>
        </template>

        <!-- direction -->
        <template v-if="activeTab === 'direction'">
          <div class="space-y-2">
            <input
              type="search"
              @input="handleStartSearch"
              placeholder="Start location"
              class="w-full h-12 border border-gray-200 rounded-lg px-4"
            />
            <input
              type="search"
              @input="handleEndSearch"
              placeholder="End location"
              class="w-full h-12 border border-gray-200 rounded-lg px-4"
            />

            <button
              class="w-full p-2 bg-sky-500 text-white rounded-lg text-lg font-semibold"
              @click="handleMeasureDistance({ start, end })"
            >
              Start
            </button>
          </div>

          <div class="relative overflow-hidden">
            <div
              v-if="isLoading"
              class="absolute top-10 left-0 right-0 bg-white/50 h-96 flex justify-center items-center"
            >
              <span class="loader"></span>
            </div>
            <ul
              class="mt-2 space-y-2 h-full overflow-y-auto"
              v-if="suggestions?.length > 0"
            >
              <li
                v-for="suggestion in suggestions"
                :key="suggestion"
                class="p-2 bg-gray-50 rounded-lg cursor-pointer shadow-sm"
                @click="
                  selectDirectionLocation({
                    type: selectType,
                    latitude: suggestion.lat,
                    longitude: suggestion.lon,
                  })
                "
              >
                {{ suggestion?.display_name }}
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";

// state
const suggestions = ref([]);
const isLoading = ref(false);
const activeTab = ref("search");
const selectType = ref("");
const start = ref({ latitude: null, longitude: null });
const end = ref({ latitude: null, longitude: null });

// instance
let L = null;
let map = null;

// toggle tabs
const toggleTab = (tab) => {
  activeTab.value = tab;
  suggestions.value = [];
};

// debounce
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

onMounted(async () => {
  L = await import("leaflet");

  navigator.geolocation.getCurrentPosition(async (e) => {
    const location = e.coords;

    map = L.map("map", {
      maxZoom: 20,
      minZoom: 6,
      zoomControl: false,
    }).setView([location.latitude, location.longitude], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([location.latitude, location.longitude]).addTo(map);

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    map.on("click", function (e) {
      selectLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });
  });
});

// handle search
const handleSearch = debounce(async (e) => {
  isLoading.value = true;

  const query = e.target.value;
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&limit=10&countrycodes=BD&format=json`;
  try {
    const response = await fetch(url);

    const data = await response.json();

    suggestions.value = data;
  } catch (error) {
    console.log("search error", error);
  } finally {
    isLoading.value = false;
  }
}, 500);

// handle start and end search
const handleStartSearch = (e) => {
  selectType.value = "start";
  handleSearch(e);
};
const handleEndSearch = (e) => {
  selectType.value = "end";
  handleSearch(e);
};

// select location
const selectLocation = debounce(async ({ latitude, longitude }) => {
  isLoading.value = true;

  if (!latitude || !longitude) return;

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
  try {
    const response = await fetch(url);

    const data = await response.json();

    map.setView([data.lat, data.lon], 13);

    L.marker([data.lat, data.lon]).addTo(map);
  } catch (error) {
    console.log("search error", error);
  } finally {
    isLoading.value = false;
  }
});

// select direction location
const selectDirectionLocation = debounce(
  async ({ type, latitude, longitude }) => {
    isLoading.value = true;

    if (!latitude || !longitude) return;

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const response = await fetch(url);

      const data = await response.json();

      if (type === "start") {
        start.value = { latitude: data.lat, longitude: data.lon };
      } else if (type === "end") {
        end.value = { latitude: data.lat, longitude: data.lon };
      }

      map.setView([data.lat, data.lon], 13);

      L.marker([data.lat, data.lon]).addTo(map);
    } catch (error) {
      console.log("search error", error);
    } finally {
      isLoading.value = false;
    }
  }
);

// handle measure distance
const handleMeasureDistance = debounce(async ({ start, end }) => {
  isLoading.value = true;
  try {
    const profile = "bike"; // bike, car, foot
    const url = `http://router.project-osrm.org/route/v1/${profile}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&alternatives=2&overview=full&geometries=geojson&continue_straight=default`;

    const response = await fetch(url);

    const data = await response.json();

    // Ensure that the route geometry coordinates exist
    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates) {
      console.error("No coordinates found in the response.");
      return;
    }

    const latLngCoordinates = coordinates.map(([lng, lat]) => [lat, lng]);

    // Create a polyline with the correct coordinates
    const polyline = L.polyline(latLngCoordinates, {
      color: "red",
      weight: 5,
      opacity: 0.7,
      smoothFactor: 1,
    }).addTo(map);

    // Zoom the map to fit the bounds of the polyline
    map.fitBounds(polyline.getBounds());
  } catch (error) {
    console.error("Error fetching route data:", error);
  } finally {
    isLoading.value = false;
  }
}, 500);
</script>
