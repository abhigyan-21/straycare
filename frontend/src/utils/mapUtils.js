export const fetchLocationName = async (lat, lng) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        if (data && data.display_name) {
            return data.display_name;
        }
    } catch (error) {
        console.error('Error fetching location name:', error);
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export const fetchLocationDetails = async (lat, lng) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        if (data && data.display_name) {
            const addressObj = data.address || {};
            const city = addressObj.city || addressObj.town || addressObj.village || addressObj.county || '';
            const state = addressObj.state || '';
            return {
                name: data.display_name,
                city,
                state
            };
        }
    } catch (error) {
        console.error('Error fetching location details:', error);
    }
    return { name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, city: '', state: '' };
};
