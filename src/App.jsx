import React, { useState, useEffect, useRef, useCallback } from 'react';

// Define the form fields specification directly in the frontend for rendering
// This *must* precisely match the requirements document and align fieldName with Code.gs
const FORM_FIELDS_SPEC_FRONTEND = [
    { group: "GENERAL INFORMATION", label: "Skatepark Name", fieldName: "skateparkName", inputType: "text", required: true, placeholder: "" },
    { group: "GENERAL INFORMATION", label: "Date of Audit", fieldName: "dateOfAudit", inputType: "date", isPhotoField: false, required: true, placeholder: "" },
    { group: "GENERAL INFORMATION", label: "Location", fieldName: "location", inputType: "textarea", isPhotoField: false, required: true, placeholder: "Notes" },
    { group: "GENERAL INFORMATION", label: "Age of Skatepark", fieldName: "ageOfSkatepark", inputType: "text", isPhotoField: false, placeholder: "" },
    { group: "GENERAL INFORMATION", label: "Auditor Name", fieldName: "auditorName", inputType: "text", isPhotoField: false, placeholder: "" },
    { group: "GENERAL INFORMATION", label: "Classification", fieldName: "classification", inputType: "select", isPhotoField: false, options: ["", "Regional", "Local", "Neighbourhood", "Spot"] },
    { group: "GENERAL INFORMATION", label: "General", fieldName: "generalPhotos", inputType: "file", isPhotoField: true, placeholder: "" },

    { group: "SITE INFORMATION", label: "Type of Skatepark", fieldName: "typeOfSkatepark", inputType: "checkbox", isPhotoField: false, options: ["Bowl", "Flow", "LTR", "Pump Track", "Pump Track – Modular", "Pump Track – Concrete", "Pump Track – Asphalt", "Ramp", "Street", "Timber Ramp"], hasSelectAll: true },
    { group: "SITE INFORMATION", label: "Style of Riding", fieldName: "styleOfRiding", inputType: "checkbox", isPhotoField: false, options: ["Flat Ground", "Pump", "Street", "Transition", "Vert"], hasSelectAll: true },
    { group: "SITE INFORMATION", label: "Typical Type of Users", fieldName: "typicalTypeOfUsers", inputType: "checkbox", isPhotoField: false, options: ["BMX", "Inline Skating", "LTR", "Rollerskating", "Scootering", "Skateboarding"], hasSelectAll: true },
    { group: "SITE INFORMATION", label: "Skill Level", fieldName: "skillLevel", inputType: "select", isPhotoField: false, options: ["", "Beginner", "Beginner-Intermediate", "Intermediate", "Intermediate-Advanced", "Advanced", "Beginner to Advanced"] },
    { group: "SITE INFORMATION", label: "Capacity", fieldName: "capacity", inputType: "select", isPhotoField: false, options: ["", "0-5 users", "5-10 users", "10-20 users", "20-40 users", "40+ users"] },
    { group: "SITE INFORMATION", label: "Signage – Existing", fieldName: "signageExisting", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "SITE INFORMATION", label: "Signage – Existing Notes", fieldName: "signageExistingNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "SITE INFORMATION", label: "Signage – Existing", fieldName: "signageExistingPhotos", inputType: "file", isPhotoField: true },
    { group: "SITE INFORMATION", label: "Signage - New", fieldName: "signageNew", inputType: "select", isPhotoField: false, options: ["", "Standard", "Standard with some Bespoke", "Bespoke", "Not Required"] },
    { group: "SITE INFORMATION", label: "Signage – New Notes", fieldName: "signageNewNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "SITE INFORMATION", label: "Signage – New", fieldName: "signageNewPhotos", inputType: "file", isPhotoField: true },
    { group: "SITE INFORMATION", label: "Site Specific Safety Issues", fieldName: "siteSpecificSafetyIssues", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "SITE INFORMATION", label: "Site-Specific Safety Issues Notes", fieldName: "siteSpecificSafetyIssuesNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "SITE INFORMATION", label: "Site-Specific Safety Issues", fieldName: "siteSpecificSafetyIssuesPhotos", inputType: "file", isPhotoField: true },
    { group: "SITE INFORMATION", label: "CPTED Issues", fieldName: "cptedIssues", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "SITE INFORMATION", label: "CPTED Issues Notes", fieldName: "cptedIssuesNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "SITE INFORMATION", label: "CPTED Issues", fieldName: "cptedIssuesPhotos", inputType: "file", isPhotoField: true },
    { group: "SITE INFORMATION", label: "Accessibility - Users", fieldName: "accessibilityUsers", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "SITE INFORMATION", label: "Accessibility - Users Notes", fieldName: "accessibilityUsersNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "SITE INFORMATION", label: "Accessibility - Users", fieldName: "accessibilityUsersPhotos", inputType: "file", isPhotoField: true },
    { group: "SITE INFORMATION", label: "Accessibility - Caregivers", fieldName: "accessibilityCaregivers", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "SITE INFORMATION", label: "Accessibility - Caregivers Notes", fieldName: "accessibilityCaregiversNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "SITE INFORMATION", label: "Accessibility - Caregivers", fieldName: "accessibilityCaregiversPhotos", inputType: "file", isPhotoField: true },

    { group: "ASSESSMENT OF SKATEPARK", label: "Overall Assessment", fieldName: "overallAssessment", inputType: "textarea", isPhotoField: false, placeholder: "Notes" },
    { group: "ASSESSMENT OF SKATEPARK", label: "Estimated Proportion of Life Consumed", fieldName: "estimatedLifeConsumed", inputType: "select", isPhotoField: false, options: ["", "CG1 – Very Good (up to 45%)", "CG2 – Good (between 45-95%)", "CG3 – Moderate (between 45-95%)", "CG4 – Poor (between 45-95%)", "CG5 – Very Poor (90-100%)"] },
    { group: "ASSESSMENT OF SKATEPARK", label: "Overall Structure", fieldName: "overallStructure", inputType: "select", isPhotoField: false, options: ["", "CG1 – Very Good (sound structure)", "CG2 – Good (functionally sound structure)", "CG3 – Moderate (adequate structure, some evidence of foundation movement, minor cracking)", "CG4 – Poor (structure functioning but with problems due to foundation movement. Some significant cracking)", "CG5 – Very Poor (the structure has serious problems, and concern is held for the integrity of the structure)"] },
    { group: "ASSESSMENT OF SKATEPARK", label: "Structural Observations", fieldName: "structuralObservations", inputType: "checkbox", isPhotoField: false, options: ["Concrete cracks – minor", "Concrete cracks – major", "Concrete deterioration around coping", "Concrete grind edge deterioration", "Concrete joint deterioration", "Significant subgrade movement", "Concrete slab uplift", "Concrete slab perforation Water pooling", "Fall heights", "Dangerous features", "Rusting edges", "Cracked walls", "Undermining of concrete slabs"], hasSelectAll: false }, // Select All DELETED
    { group: "ASSESSMENT OF SKATEPARK", label: "Structural Observations Notes", fieldName: "structuralObservationsNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "ASSESSMENT OF SKATEPARK", label: "Structural Observations", fieldName: "structuralObservationsPhotos", inputType: "file", isPhotoField: true },

    // INDIVIDUAL FEATURES will be rendered explicitly after ASSESSMENT OF SKATEPARK
    
    { group: "FUNCTION AND DESIGN", label: "Overall Function", fieldName: "overallFunction", inputType: "select", isPhotoField: false, options: ["", "Good", "Adequate", "Bad"] },
    { group: "FUNCTION AND DESIGN", label: "Function Notes", fieldName: "functionNotes", inputType: "textarea", isPhotoField: false, placeholder: "Notes" },
    { group: "FUNCTION AND DESIGN", label: "Function", fieldName: "functionPhotos", inputType: "file", isPhotoField: true },
    { group: "FUNCTION AND DESIGN", label: "Design – Layout of Elements", fieldName: "designLayoutElements", inputType: "select", isPhotoField: false, options: ["", "Good", "Adequate", "Bad"] },
    { group: "FUNCTION AND DESIGN", label: "Design - Layout of Elements Notes", fieldName: "designLayoutElementsNotes", inputType: "textarea", isPhotoField: false, placeholder: "Notes" },
    { group: "FUNCTION AND DESIGN", label: "Design - Layout of Elements", fieldName: "designLayoutElementsPhotos", inputType: "file", isPhotoField: true },
    { group: "FUNCTION AND DESIGN", label: "Conflict of Users", fieldName: "conflictOfUsers", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "FUNCTION AND DESIGN", label: "Conflict Notes", fieldName: "conflictNotes", inputType: "textarea", isPhotoField: false, placeholder: "Notes" },
    { group: "FUNCTION AND DESIGN", label: "Conflict", fieldName: "conflictPhotos", inputType: "file", isPhotoField: true },
    { group: "FUNCTION AND DESIGN", label: "Aesthetic", fieldName: "aesthetic", inputType: "textarea", isPhotoField: false, placeholder: "look and feel, comfort / safety, community sense" },
    { group: "FUNCTION AND DESIGN", label: "Aesthetic", fieldName: "aestheticPhotos", inputType: "file", isPhotoField: true },
    { group: "FUNCTION AND DESIGN", label: "Regionally Significant Asset", fieldName: "regionallySignificantAsset", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "FUNCTION AND DESIGN", label: "Regionally Significant Asset Notes", fieldName: "regionallySignificantAssetNotes", inputType: "textarea", isPhotoField: false, placeholder: "features that make this regionally significant or unique" },
    { group: "FUNCTION AND DESIGN", label: "Regionally Significant Asset", fieldName: "regionallySignificantAssetPhotos", inputType: "file", isPhotoField: true },

    { group: "AMENITIES", label: "Toilets", fieldName: "toilets", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Toilets Notes", fieldName: "toiletsNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Toilets", fieldName: "toiletsPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Playgrounds", fieldName: "playgrounds", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Playgrounds Notes", fieldName: "playgroundsNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Playgrounds", fieldName: "playgroundsPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Seating", fieldName: "seating", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Seating Notes", fieldName: "seatingNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Seating", fieldName: "seatingPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Shade", fieldName: "shade", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Shade Notes", fieldName: "shadeNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Shade", fieldName: "shadePhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Drinking Fountain", fieldName: "drinkingFountain", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Drinking Fountain Notes", fieldName: "drinkingFountainNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Drinking Fountain", fieldName: "drinkingFountainPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Planting", fieldName: "planting", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Planting Notes", fieldName: "plantingNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Planting", fieldName: "plantingPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Lighting", fieldName: "lighting", inputType: "select", isPhotoField: false, options: ["", "Adequate", "Inadequate", "None"] },
    { group: "AMENITIES", label: "Lighting Notes", fieldName: "lightingNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Lighting", fieldName: "lightingPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Lighting New Bulbs Required?", fieldName: "lightingNewBulbsRequired", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Carparking", fieldName: "carparking", inputType: "select", isPhotoField: false, options: ["", "Adequate", "Inadequate", "None"] },
    { group: "AMENITIES", label: "Carparking Notes", fieldName: "carparkingNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Carparking", fieldName: "carparkingPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Pathways", fieldName: "pathways", inputType: "select", isPhotoField: false, options: ["", "Adequate", "Inadequate", "None"] },
    { group: "AMENITIES", label: "Pathways Notes", fieldName: "pathwaysNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Pathways", fieldName: "pathwaysPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Drainage Assessment", fieldName: "drainageAssessment", inputType: "select", isPhotoField: false, options: ["", "Good", "Fair", "Poor"] },
    { group: "AMENITIES", label: "Drainage Assessment Notes", fieldName: "drainageAssessmentNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Drainage Assessment", fieldName: "drainageAssessmentPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Water Pooling", fieldName: "waterPooling", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Water Pooling Notes", fieldName: "waterPoolingNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Water Pooling", fieldName: "waterPoolingPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Blocked Drains", fieldName: "blockedDrains", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Blocked Drains Notes", fieldName: "blockedDrainsNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Blocked Drains", fieldName: "blockedDrainsPhotos", inputType: "file", isPhotoField: true },
    { group: "AMENITIES", label: "Overland Flow", fieldName: "overlandFlow", inputType: "radio", isPhotoField: false, options: ["Yes", "No"] },
    { group: "AMENITIES", label: "Overland Flow Notes", fieldName: "overlandFlowNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "AMENITIES", label: "Overland Flow", fieldName: "overlandFlowPhotos", inputType: "file", isPhotoField: true },

    { group: "MAINTENANCE", label: "Overall Maintenance", fieldName: "overallMaintenance", inputType: "select", isPhotoField: false, options: ["", "CG1 – Very Good (well maintained and clean)", "CG2 – Good (an increased maintenance inspection is required)", "CG3 – Moderate (regular and programmed maintenance inspections are essential)", "CG4 – Poor (frequent maintenance inspections are essential – short-term element replacement / rehabilitation required)", "CG5 – Very Poor (minimum life expectancy, requiring urgent rehabilitation or replacement)"] },
    { group: "MAINTENANCE", label: "General Maintenance", fieldName: "generalMaintenance", inputType: "checkbox", isPhotoField: false, options: ["Bark mulch drift", "Leaf litter", "Mowing", "Edging", "Rubbish", "Graffiti"], hasSelectAll: true },
    { group: "MAINTENANCE", label: "General Maintenance Notes", fieldName: "generalMaintenanceNotes", inputType: "text", isPhotoField: false, placeholder: "Notes" },
    { group: "MAINTENANCE", label: "General Maintenance", fieldName: "generalMaintenancePhotos", inputType: "file", isPhotoField: true },

    { group: "ADDITIONAL COMMENTS", label: "Additional Comments", fieldName: "additionalComments", inputType: "textarea", isPhotoField: false, placeholder: "Notes" },
    { group: "ADDITIONAL COMMENTS", label: "Additional Comments", fieldName: "additionalCommentsPhotos", inputType: "file", isPhotoField: true },
];

// Define the spec for Individual Features fields
const INDIVIDUAL_FEATURE_SPEC = [
    { label: "Feature Name", fieldName: "featureName", inputType: "text", placeholder: "e.g., Quarter Pipe, Ledge, Bowl" },
    { label: "Feature Condition", fieldName: "featureCondition", inputType: "select", options: ["", "Excellent", "Good", "Fair", "Poor"] },
    { label: "Feature Structural Observations", fieldName: "featureStructuralObservations", inputType: "checkbox", options: ["Concrete cracks – minor", "Concrete cracks – major", "Concrete deterioration around coping", "Concrete grind edge deterioration", "Concrete joint deterioration", "Significant subgrade movement", "Concrete slab uplift", "Concrete slab perforation Water pooling", "Fall heights", "Dangerous features", "Rusting edges", "Cracked walls", "Undermining of concrete slabs"], hasSelectAll: false }, // Select All DELETED
    { label: "Feature Notes", fieldName: "featureNotes", inputType: "textarea", placeholder: "Notes for this specific feature" },
    { label: "Feature", fieldName: "featurePhotos", inputType: "file", isPhotoField: true },
];

function App() {
    const [formData, setFormData] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const resumeDraftFileName = urlParams.get('resumeDraftFileName');
        if (resumeDraftFileName) {
            // If resuming from draft, initial state will be set by useEffect after fetch
            return {};
        }

        const savedData = localStorage.getItem('skateparkFormData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Ensure individualFeatures is an array, and if empty, add one default feature
                if (!parsedData.individualFeatures || parsedData.individualFeatures.length === 0) {
                    parsedData.individualFeatures = [{
                        featureName: '',
                        featureCondition: '',
                        featureStructuralObservations: [],
                        featureNotes: '',
                        featurePhotos: []
                    }];
                } else if (!Array.isArray(parsedData.individualFeatures)) {
                    // Handle case where it's not an array but exists (shouldn't happen with proper saving)
                    parsedData.individualFeatures = [];
                }

                FORM_FIELDS_SPEC_FRONTEND.forEach(field => {
                    if (field.isPhotoField && parsedData[field.fieldName] && Array.isArray(parsedData[field.fieldName]) && typeof parsedData[field.fieldName][0] === 'string') {
                        parsedData[field.fieldName] = parsedData[field.fieldName].map(name => ({ originalName: name, type: 'image/jpeg' }));
                    }
                });
                if (parsedData.individualFeatures) {
                    parsedData.individualFeatures = parsedData.individualFeatures.map(feature => {
                        if (feature.featurePhotos && Array.isArray(feature.featurePhotos) && typeof feature.featurePhotos[0] === 'string') {
                            feature.featurePhotos = feature.featurePhotos.map(name => ({ originalName: name, type: 'image/jpeg' }));
                        }
                        return feature;
                    });
                }
                return parsedData;
            } catch (e) {
                console.error("Failed to parse saved form data from localStorage:", e);
                localStorage.removeItem('skateparkFormData');
                // Return a fresh state with one default feature if localStorage is corrupted or empty
                return {
                    individualFeatures: [{
                        featureName: '',
                        featureCondition: '',
                        featureStructuralObservations: [],
                        featureNotes: '',
                        featurePhotos: []
                    }]
                };
            }
        }
        // Default initial state if no saved data and not resuming from draft
        return {
            individualFeatures: [{
                featureName: '',
                featureCondition: '',
                featureStructuralObservations: [],
                featureNotes: '',
                featurePhotos: []
            }]
        };
    });
    const [uploadedImages, setUploadedImages] = useState({});
    const [statusMessage, setStatusMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const messageTimeoutRef = useRef(null);
    const userId = useRef(crypto.randomUUID()); // Simple client-side user ID

    // Parse URL for resumeDraftFileName on initial load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const resumeDraftFileName = urlParams.get('resumeDraftFileName');
        if (resumeDraftFileName) {
            console.log(`Attempting to resume draft with file name: ${resumeDraftFileName}`);
            setStatusMessage('Loading draft...');
            setMessageType('');

            fetch(`/api?resumeDraftFileName=${encodeURIComponent(resumeDraftFileName)}`)
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        console.log("Draft data received:", data.formData);
                        const loadedFormData = { ...data.formData };

                        // Reconstruct individual features array from flattened keys from backend
                        const reconstructedFeatures = [];
                        const flattenedFeatureKeys = Object.keys(loadedFormData).filter(key => key.startsWith('individualFeatures['));
                        const featureIndices = [...new Set(flattenedFeatureKeys.map(key => parseInt(key.match(/\[(\d+)\]/)[1])))].sort((a,b) => a - b);

                        featureIndices.forEach(idx => {
                            const feature = {};
                            const expectedFeatureProps = INDIVIDUAL_FEATURE_SPEC.map(spec => spec.fieldName);

                            expectedFeatureProps.forEach(propName => {
                                const flattenedKey = `individualFeatures[${idx}].${propName}`;
                                let value = loadedFormData[flattenedKey];

                                if (value === null || value === undefined) {
                                    value = '';
                                } else if (typeof value === 'boolean') {
                                    value = value ? "Yes" : "No";
                                } else if (propName === 'featurePhotos' && typeof value === 'string') {
                                    value = value.split(',').map(name => ({ originalName: name.trim(), type: 'image/jpeg' })).filter(item => item.originalName);
                                } else if (INDIVIDUAL_FEATURE_SPEC.find(spec => spec.fieldName === propName && spec.inputType === 'checkbox') && typeof value === 'string') {
                                    value = value.split(',').map(s => s.trim()).filter(Boolean);
                                }
                                feature[propName] = value;
                                delete loadedFormData[flattenedKey]; // Clean up flattened key
                            });
                            reconstructedFeatures.push(feature);
                        });
                        // Ensure exactly one feature if loaded array is empty or has too many
                        if (reconstructedFeatures.length === 0) {
                            reconstructedFeatures.push({
                                featureName: '',
                                featureCondition: '',
                                featureStructuralObservations: [],
                                featureNotes: '',
                                featurePhotos: []
                            });
                        }
                        // Only take the first feature if more than one is loaded from draft (to avoid "Feature 2")
                        // If the user wants to resume a draft with multiple features, this will truncate it.
                        // Based on "form is Feature 1 and then the user can select Add another feature",
                        // it implies we always start with 1 visible and others are added.
                        // Let's ensure only the first one is loaded if it's not explicitly stated
                        // to load all previously saved features.
                        // For now, let's just make sure at least one is present.
                        loadedFormData.individualFeatures = reconstructedFeatures;


                        // Ensure all known fields from FORM_FIELDS_SPEC_FRONTEND are present,
                        // initialized to empty for fields not included in PHASE1_DRAFT_FIELDS
                        FORM_FIELDS_SPEC_FRONTEND.forEach(field => {
                            // If a field exists in spec but not in loaded data, initialize it
                            if (loadedFormData[field.fieldName] === undefined) {
                                if (field.inputType === 'checkbox' || field.inputType === 'file') {
                                    loadedFormData[field.fieldName] = [];
                                } else {
                                    loadedFormData[field.fieldName] = '';
                                }
                            }
                            // Special handling for radio buttons during load:
                            // If the loaded value is "Yes" or "No" string, keep it.
                            // If it's an empty string and a radio, ensure it defaults to no selection.
                            // This specifically covers cases where the backend might return "" for a radio not selected.
                            if (field.inputType === 'radio' && loadedFormData[field.fieldName] === '') {
                                // Keep as empty string, React will handle non-checked state.
                            } else if (field.inputType === 'date' && typeof loadedFormData[field.fieldName] === 'string') {
                                // Ensure date strings are valid for HTML date input
                                if (loadedFormData[field.fieldName].length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(loadedFormData[field.fieldName])) {
                                    try {
                                        const parsedDate = new Date(loadedFormData[field.fieldName]);
                                        if (!isNaN(parsedDate.getTime())) {
                                            loadedFormData[field.fieldName] = new Date(parsedDate.getTime() - (parsedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                                        } else {
                                            loadedFormData[field.fieldName] = ''; // Invalid date string
                                        }
                                    } catch (e) {
                                        loadedFormData[field.fieldName] = '';
                                    }
                                }
                            }
                        });


                        setFormData(loadedFormData);
                        setStatusMessage('Draft loaded successfully!');
                        setMessageType('success');
                        window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
                    } else {
                        setStatusMessage(`Failed to load draft: ${data.message}`);
                        setMessageType('error');
                    }
                })
                .catch(error => {
                    console.error("Error loading draft:", error);
                    setStatusMessage(`Error loading draft: ${error.message}`);
                    setMessageType('error');
                    window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
                });
        }
    }, []);

    // Effect to manage local storage persistence
    useEffect(() => {
        const saveTimeout = setTimeout(() => {
            localStorage.setItem('skateparkFormData', JSON.stringify(formData));
        }, 500); // Debounce saving to localStorage
        return () => clearTimeout(saveTimeout);
    }, [formData]);

    // Effect to clear status messages after a delay
    useEffect(() => {
        if (statusMessage) {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
            messageTimeoutRef.current = setTimeout(() => {
                setStatusMessage('');
                setMessageType('');
            }, 5000); // Message disappears after 5 seconds
        }
        return () => {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
        };
    }, [statusMessage]);

    const handleSelectAll = useCallback((fieldName, options, checked) => {
        setFormData(prevData => {
            const newValues = checked ? [...options] : [];
            return {
                ...prevData,
                [fieldName]: newValues
            };
        });
    }, []);

            const handleChange = useCallback((e) => {
            const { name, value, type, checked, files } = e.target; // 'files' will only be present if this is a file input change

            setFormData(prevData => {
                let newData = { ...prevData };

                // Handle nested fields (e.g., individualFeatures[0].featureName)
                if (name.includes('[') && name.includes(']')) {
                    const [baseName, rest] = name.split('[');
                    const index = parseInt(rest.split(']')[0]);
                    const propName = rest.split(']')[1].substring(1); // remove leading dot

                    const newArray = [...(newData[baseName] || [])];
                    if (!newArray[index]) {
                        newArray[index] = {}; // Initialize object if it doesn't exist
                    }

                    // FILE HANDLING FOR NESTED FIELDS MOVED TO renderField's onChange for type='file'
                    if (type === 'checkbox') {
                        const currentValues = newArray[index][propName] || [];
                        const updatedValues = checked
                            ? [...currentValues, value]
                            : currentValues.filter(item => item !== value);
                        newData = {
                            ...newData,
                            [baseName]: newArray.map((item, i) => i === index ? { ...item, [propName]: updatedValues } : item)
                        };
                    } else {
                        newData = {
                            ...newData,
                            [baseName]: newArray.map((item, i) => i === index ? { ...item, [propName]: value } : item)
                        };
                    }
                // FILE HANDLING FOR TOP-LEVEL FIELDS MOVED TO renderField's onChange for type='file'
                } else if (type === 'checkbox') {
                    const currentValues = newData[name] || [];
                    const updatedValues = checked
                        ? [...currentValues, value]
                        : currentValues.filter(item => item !== value);
                    newData = { ...newData, [name]: updatedValues };
                } else {
                    newData = { ...newData, [name]: value };
                }
                return newData;
            });
        }, []);
        

    const addFeature = useCallback(() => {
        setFormData(prevData => ({
            ...prevData,
            individualFeatures: [...(prevData.individualFeatures || []), {
                featureName: '',
                featureCondition: '',
                featureStructuralObservations: [],
                featureNotes: '',
                featurePhotos: []
            }]
        }));
    }, []);

    // Removed removeFeature function as per user request (logic also removed from elsewhere)

    const handleSubmit = async (actionType) => {
	console.log("Submit button clicked, handleSubmit triggered!"); // Add THIS LINE
        setStatusMessage('Processing...');
        setMessageType('');

        // Flatten individualFeatures for submission if they exist
        const submissionFormData = { ...formData };
        if (submissionFormData.individualFeatures && Array.isArray(submissionFormData.individualFeatures)) {
            // Remove empty features before flattening for submission
            const featuresToSubmit = submissionFormData.individualFeatures.filter(feature => 
                feature.featureName || feature.featureCondition || feature.featureStructuralObservations.length > 0 || feature.featureNotes || feature.featurePhotos.length > 0
            );

            featuresToSubmit.forEach((feature, index) => {
                Object.keys(feature).forEach(propName => {
                    const flattenedKey = `individualFeatures[${index}].${propName}`;
                    // Convert arrays back to comma-separated strings for checkboxes/multi-select
                    if (Array.isArray(feature[propName])) {
                        submissionFormData[flattenedKey] = feature[propName].join(', ');
                    } else if (typeof feature[propName] === 'boolean') {
                        submissionFormData[flattenedKey] = feature[propName] ? "Yes" : "No";
                    } else {
                        submissionFormData[flattenedKey] = feature[propName];
                    }
                });
            });
            delete submissionFormData.individualFeatures; // Remove original array
        }
        
        // Prepare uploadedImages by reading base64 data for files selected in this submission
        const imagesToUpload = {};
        for (const fieldName in uploadedImages) {
            if (uploadedImages.hasOwnProperty(fieldName) && uploadedImages[fieldName].length > 0) {
                imagesToUpload[fieldName] = await Promise.all(uploadedImages[fieldName].map(async (fileObj) => {
                    // Only read base64 if it's not already there (e.g., from a loaded draft)
                    if (fileObj.base64) {
                        return fileObj;
                    }
                    return new Promise((resolve, reject) => { 
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            resolve({
                                originalName: fileObj.originalName,
                                type: fileObj.type,
                                base64: reader.result
                            });
                        };
                        reader.onerror = (error) => { 
                            console.error("FileReader error:", error);
                            reject(new Error("Failed to read file"));
                        };
                        
                        // Ensure fileObj.actualFile exists before reading
                        if (fileObj.actualFile instanceof File) {
                            reader.readAsDataURL(fileObj.actualFile);
                        } else {
                            // If it's just metadata and no actual file, or invalid file object, resolve with existing info
                            resolve(fileObj); 
                        }
                    });
                }));
            }
        }
	try {
            const response = await fetch('http://localhost:55555/api', { // Ensure the ')' is here!
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    actionType,
                    formData: submissionFormData,
                    uploadedImages: imagesToUpload,
                    userId: userId.current
                }),
            }); // Make sure this closing ')' and '}' are in place correctly

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            // ... rest of your try block


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setStatusMessage(data.message);
                setMessageType('success');
                if (actionType === 'submit') {
                    setFormData({}); // Clear form on successful submission
                    setUploadedImages({}); // Clear uploaded images
                    localStorage.removeItem('skateparkFormData'); // Clear local storage
                    window.scrollTo(0, 0); // Scroll to top
                }
            } else {
                setStatusMessage(data.message);
                setMessageType('error');
            }
        } catch (error) {
            console.error("Submission error:", error);
            setStatusMessage(`Error: ${error.message}`);
            setMessageType('error');
        }
    };

    // Helper to render individual fields based on their specification
    const renderField = (fieldSpec, currentFormData, featureIndex = null) => {
        // Determine the field's actual name for form data (handles nested features)
        const fieldName = featureIndex !== null ? `individualFeatures[${featureIndex}].${fieldSpec.fieldName}` : fieldSpec.fieldName;
        
        // Get the current value for the field
        let fieldValue;
        if (featureIndex !== null) {
            fieldValue = currentFormData.individualFeatures?.[featureIndex]?.[fieldSpec.fieldName];
        } else {
            fieldValue = currentFormData[fieldSpec.fieldName];
        }
        
        // Ensure fieldValue is always an array for checkboxes for consistent handling
        if (fieldSpec.inputType === 'checkbox' && !Array.isArray(fieldValue)) {
            fieldValue = [];
        } else if (fieldValue === undefined || fieldValue === null) {
            fieldValue = '';
        }

        // Conditional rendering for 'Lighting New Bulbs Required?'
        // This checks the lighting field value from the top-level formData
        if (fieldSpec.fieldName === 'lightingNewBulbsRequired' && formData.lighting === 'None') {
            return null; // Don't render if Lighting is None
        }

        let inputElement;

        switch (fieldSpec.inputType) {
            case 'text':
            case 'date':
                inputElement = (
                    <input
                        type={fieldSpec.inputType}
                        name={fieldName}
                        value={fieldValue}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        placeholder={fieldSpec.placeholder || ''}
                        required={fieldSpec.required}
                    />
                );
                break;
            case 'textarea':
                inputElement = (
                    <textarea
                        name={fieldName}
                        value={fieldValue}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        placeholder={fieldSpec.placeholder || ''}
                        required={fieldSpec.required}
                    ></textarea>
                );
                break;
            case 'select':
                inputElement = (
                    <select
                        name={fieldName}
                        value={fieldValue}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                        required={fieldSpec.required}
                    >
                        {/* Add empty option for select if not required and no default selected */}
                        {fieldSpec.options && fieldSpec.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                );
                break;
            case 'radio':
                inputElement = (
                    <div className="mt-1 flex flex-wrap gap-x-4">
                        {fieldSpec.options && fieldSpec.options.map(option => (
                            <label key={option} className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name={fieldName}
                                    value={option}
                                    checked={fieldValue === option}
                                    onChange={handleChange}
                                    className="form-radio h-4 w-4 text-indigo-600 rounded-full"
                                    required={fieldSpec.required && !fieldValue}
                                />
                                <span className="ml-2 text-gray-700">{option}</span>
                            </label>
                        ))}
                    </div>
                );
                break;
            case 'checkbox':
                inputElement = (
                    <div className="mt-1">
                        {fieldSpec.hasSelectAll && (
                            <label className="inline-flex items-center mr-4 mb-2 font-semibold text-indigo-700">
                                <input
                                    type="checkbox"
                                    checked={fieldValue.length === fieldSpec.options.length}
                                    onChange={(e) => handleSelectAll(fieldName, fieldSpec.options, e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                                />
                                <span className="ml-2">Select All</span>
                            </label>
                        )}
                        <div className="flex flex-wrap gap-x-4">
                            {fieldSpec.options && fieldSpec.options.map(option => (
                                <label key={option} className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name={fieldName}
                                        value={option}
                                        checked={fieldValue.includes(option)}
                                        onChange={handleChange}
                                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                                        required={fieldSpec.required && fieldValue.length === 0}
                                    />
                                    <span className="ml-2 text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
                break;
            case 'file':
                const displayFiles = Array.isArray(fieldValue) ? fieldValue : [];
                inputElement = (
                    <div>
                        <input
                            type="file"
                            name={fieldName}
                           
        onChange={(e) => {
            const selectedFiles = Array.from(e.target.files);

            // Update uploadedImages state for Base64 conversion later
            setUploadedImages(prevImages => {
                const updatedImagesForUpload = { ...prevImages };
                updatedImagesForUpload[fieldName] = selectedFiles.map(file => ({
                    originalName: file.name,
                    type: file.type,
                    actualFile: file, // Store the File object here for FileReader to use
                    base64: '' // Base64 will be populated by handleSubmit's Promise.all
                }));
                return updatedImagesForUpload;
            });

            // Update formData state with just file names for display
            setFormData(prevData => {
                let newData = { ...prevData };
                const fileNames = selectedFiles.map(f => f.name);

                if (featureIndex !== null) {
                    // Handle nested individualFeatures
                    const newFeatures = [...(newData.individualFeatures || [])];
                    if (!newFeatures[featureIndex]) {
                        newFeatures[featureIndex] = {};
                    }
                    newFeatures[featureIndex] = { ...newFeatures[featureIndex], [fieldSpec.fieldName]: fileNames };
                    newData = { ...newData, individualFeatures: newFeatures };
                } else {
                    // Handle top-level fields
                    newData = { ...newData, [fieldSpec.fieldName]: fileNames };
                }
                return newData;
            });
        }}
        

                            multiple
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            required={fieldSpec.required && displayFiles.length === 0}
                        />
                        {displayFiles.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                                Selected: {displayFiles.map(f => f).join(', ')}
                            </div>
                        )}
                    </div>
                );
                break;
            default:
                // Handle unknown input types gracefully to avoid breaking the form
                inputElement = <p className="text-red-500">Error: Unknown input type "{fieldSpec.inputType}" for field "{fieldSpec.label}"</p>;
                break;
        }

        return (
            <div key={fieldName} className="mb-4">
                {/* Conditionally render label only if it's NOT a photo field */}
                {!fieldSpec.isPhotoField && (
                    <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
                        {fieldSpec.label} {fieldSpec.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                {inputElement}
            </div>
        );
    };

    const formGroupOrder = [
        "GENERAL INFORMATION",
        "SITE INFORMATION",
        "ASSESSMENT OF SKATEPARK",
        "INDIVIDUAL FEATURES_SECTION", // Special identifier for rendering the dynamic section
        "FUNCTION AND DESIGN",
        "AMENITIES",
        "MAINTENANCE",
        "ADDITIONAL COMMENTS"
    ];

    // Map fields to their respective groups for easier rendering
    const groupedFields = {};
    FORM_FIELDS_SPEC_FRONTEND.forEach(field => {
        if (!groupedFields[field.group]) {
            groupedFields[field.group] = [];
        }
        groupedFields[field.group].push(field);
    });

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-inter">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                .form-group-heading {
                    background-color: #e0f2fe; /* Light blue background for headings */
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1.5rem;
                    font-weight: 600;
                    color: #0d47a1; /* Darker blue text */
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                .status-message {
                    padding: 0.75rem 1.25rem;
                    margin-bottom: 1rem;
                    border: 1px solid transparent;
                    border-radius: 0.375rem;
                    font-weight: 500;
                }
                .status-message.success {
                    color: #0f5132;
                    background-color: #d1e7dd;
                    border-color: #badbcc;
                }
                .status-message.error {
                    color: #842029;
                    background-color: #f8d7da;
                    border-color: #f5c2c7;
                }
                `}
            </style>

            <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <img src="https://placehold.co/150x50/333/white?text=RICH%20LANDSCAPES" alt="RICH Landscapes Logo" className="h-12 w-auto rounded-md" />
                    <h1 className="text-3xl font-bold text-gray-800">Skatepark Audit Form</h1>
                    <button
                        type="button"
                        onClick={() => handleSubmit('saveDraft')}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-200"
                    >
                        Save as Draft
                    </button>
                </div>

                {statusMessage && (
                    <div className={`status-message ${messageType}`}>
                        {statusMessage}
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('submit'); }} className="space-y-6">
                    {formGroupOrder.map(groupName => (
                        <React.Fragment key={groupName}>
                            {/* Render group heading */}
                            <h2 className="form-group-heading text-lg mt-8">{groupName.replace('_SECTION', '')}</h2>

                            {groupName === "INDIVIDUAL FEATURES_SECTION" ? (
                                <>
                                    {(formData.individualFeatures || []).map((feature, index) => (
                                        <div key={index} className="border border-gray-300 p-6 rounded-lg mb-4 bg-gray-50 shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Feature {index + 1}</h3>
                                            {INDIVIDUAL_FEATURE_SPEC.map(fieldSpec => (
                                                <React.Fragment key={`${fieldSpec.fieldName}-${index}`}>
                                                    {renderField(fieldSpec, { individualFeatures: formData.individualFeatures }, index)}
                                                </React.Fragment>
                                            ))}
                                            {/* "Remove Feature" button intentionally removed */}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 mt-4"
                                    >
                                        Add Individual Feature
                                    </button>
                                </>
                            ) : (
                                groupedFields[groupName] && groupedFields[groupName].map(field => renderField(field, formData))
                            )}
                        </React.Fragment>
                    ))}

                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                        <button
                            type="submit"
                            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-200 text-lg"
                        >
                            Submit Audit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default App;
