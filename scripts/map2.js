function showMap() {
  // Defines basic mapbox data
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYWRhbWNoZW4zIiwiYSI6ImNsMGZyNWRtZzB2angzanBjcHVkNTQ2YncifQ.fTdfEXaQ70WoIFLZ2QaRmQ";
  const map = new mapboxgl.Map({
    container: "map", // Container ID
    style: "mapbox://styles/mapbox/streets-v11", // Styling URL
    center: [-122.964274, 49.236082], // Starting position
    zoom: 8, // Starting zoom
  });

  // Add user controls to map
  map.addControl(new mapboxgl.NavigationControl());

  // Adds map features
  map.on("load", () => {
    // Defines map pin icon for events
    map.loadImage(
      "https://cdn.iconscout.com/icon/free/png-256/pin-locate-marker-location-navigation-16-28668.png",
      (error, image) => {
        if (error) throw error;

        // Add the image to the map style.
        map.addImage("eventpin", image); // Pin Icon

        // READING information from "events" collection in Firestore
        var currentUser;
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            // User is signed in.
            // Do something for the user here.
            currentUserUID = user.uid;
          } else {
            // No user is signed in.
          }
        });
        db.collection("users")
          .get()
          .then((allEvents) => {
            const features = []; // Defines an empty array for information to be added to

            allEvents.forEach((doc) => {
              if (doc.id === currentUserUID) {
                return;
              }
              lat = doc.data().lat;
              lng = doc.data().lng;
              //   console.log(lat, lng);
              coordinates = [lng, lat];
              //   console.log(coordinates);
              // Coordinates
              event_name = doc.data().name; // Event Name
              gender = doc.data().gender; // Text Preview
              department = doc.data().department;
              // img = doc.data().posterurl; // Image
              // url = doc.data().link; // URL

              // Pushes information into the features array
              features.push({
                type: "Feature",
                properties: {
                  description: `<strong>${event_name}</strong><p>${gender}</p> <br> <p>${department}</p><button id="buddyup-btn" data-user-id="${doc.id}">Ask to Buddyup</button>`,
                },
                geometry: {
                  type: "Point",
                  coordinates: coordinates,
                },
              });
            });

            // Adds features as a source to the map
            map.addSource("places", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: features,
              },
            });

            // Creates a layer above the map displaying the pins
            map.addLayer({
              id: "places",
              type: "symbol",
              // source: 'places',
              source: "places",
              layout: {
                "icon-image": "eventpin", // Pin Icon
                "icon-size": 0.1, // Pin Size
                "icon-allow-overlap": true, // Allows icons to overlap
              },
            });

            // Map On Click function that creates a popup, displaying previously defined information from "events" collection in Firestore
            map.on("click", "places", (e) => {
              // Copy coordinates array.
              const coordinates = e.features[0].geometry.coordinates.slice();
              const description = e.features[0].properties.description;

              // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }

              const popup = new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);

              // Add event listener to the "Ask to Buddyup" button
              const buddyupBtn = popup._content.querySelector("#buddyup-btn");
              buddyupBtn.addEventListener("click", async (event) => {
                // Retrieve the user's information
                const userId = event.target.getAttribute("data-user-id");
                const user = await db.collection("users").doc(userId).get();

                // Send a buddyup request to the user
                const request = {
                  senderId: currentUserUID,
                  senderName: "Your name", // Replace with your name
                  recipientId: userId,
                  recipientName: user.data().name, // Replace with the user's name
                  message: "Would you like to buddy up?",
                  status: "pending",
                };
                await db.collection("requests").add(request);

                // Send an alert to the user
                alert(`Buddyup request sent to ${user.data().name}`);
              });
            });

            // Change the cursor to a pointer when the mouse is over the places layer.
            map.on("mouseenter", "places", () => {
              map.getCanvas().style.cursor = "pointer";
            });

            // Defaults cursor when not hovering over the places layer
            map.on("mouseleave", "places", () => {
              map.getCanvas().style.cursor = "";
            });
          });
      }
    );

    // Add the image to the map style.
    map.loadImage(
      "https://cdn-icons-png.flaticon.com/512/61/61168.png",
      (error, image) => {
        if (error) throw error;

        // Add the image to the map style with width and height values
        map.addImage("userpin", image, {
          width: 10,
          height: 10,
        });

        // Adds user's current location as a source to the map
        navigator.geolocation.getCurrentPosition((position) => {
          const userLocation = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          console.log(userLocation);
          if (userLocation) {
            map.addSource("userLocation", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: userLocation,
                    },
                    properties: {
                      description: "Your location",
                    },
                  },
                ],
              },
            });

            // Creates a layer above the map displaying the user's location
            map.addLayer({
              id: "userLocation",
              type: "symbol",
              source: "userLocation",
              layout: {
                "icon-image": "userpin", // Pin Icon
                "icon-size": 0.05, // Pin Size
                "icon-allow-overlap": true, // Allows icons to overlap
              },
            });

            // Map On Click function that creates a popup displaying the user's location
            map.on("click", "userLocation", (e) => {
              // Copy coordinates array.
              const coordinates = e.features[0].geometry.coordinates.slice();
              const description = e.features[0].properties.description;

              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
            });

            // Change the cursor to a pointer when the mouse is over the userLocation layer.
            map.on("mouseenter", "userLocation", () => {
              map.getCanvas().style.cursor = "pointer";
            });

            // Defaults
            // Defaults cursor when not hovering over the userLocation layer
            map.on("mouseleave", "userLocation", () => {
              map.getCanvas().style.cursor = "";
            });
          }
        });
      }
    );
  });
}

// Call the function to display the map with the user's location and event pins
showMap();


function listenForBuddyUpRequest() {
  // Get the requests collection
  const requestsRef = db.collection("requests");

  // Listen for changes in the requests collection
  requestsRef.onSnapshot((snapshot) => {
    // Loop through the documents in the collection
    snapshot.forEach((doc) => {
      // Get the recipientId from the document data
      var currentRequest = doc.data();
      var requestRecipientId = currentRequest.recipientId;
      var requestStatus = currentRequest.status;
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          var currentUserID = user.uid;
          // Check if the recipientId matches with the input recipientId
          if (
            requestRecipientId === currentUserID &&
            requestStatus === "pending"
          ) {
            // Show an alert with options to accept or decline the BuddyUp request
            if (
              confirm(
                "You have a BuddyUp request. Do you want to accept or decline?"
              )
            ) {
              // User clicked "OK" or "Accept"
              // Handle the accept logic here
              doc.ref
                .update({
                  status: "success",
                })
                .then(() => {
                  console.log("BuddyUp request accepted");
                });
            } else {
              // User clicked "Cancel" or "Decline"
              // Handle the decline logic here
              doc.ref
                .update({
                  status: "failure",
                })
                .then(() => {
                  console.log("BuddyUp request declined");
                });
            }
          }
        } else {
          // No user is signed in.
        }
      });
    });
  });
}

// Example usage
listenForBuddyUpRequest();

function checkRequests() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      // Do something for the user here.
      currentUserUid = user.uid;
      console.log(currentUserUid);
      const requestsRef = db.collection("requests");
      requestsRef
        .where("senderId", "==", currentUserUid)
        .where("status", "in", ["success", "failure"]) // Listen for changes in "success" or "failure" statuses
        .onSnapshot((querySnapshot) => {
          // Use onSnapshot() to listen for changes in the collection
          querySnapshot.forEach((doc) => {
            if (doc.data().status === "success") {
              const phoneNumber = doc.data().phoneNumber;
              alert(
                `Congrats, you are paired! The phone number of the person will be emailed to you.`
              );
              db.collection("history").add({
                senderID: doc.data().senderId,
                senderName: doc.data().senderName, // Replace with your name
                recipientID: doc.data().recipientId,
                recipientName: doc.data().recipientName, // Replace with the user's name
                timestamp: doc.data().timestamp,
                status: 'Accepted'
              })
              doc.ref.delete();
            } else if (doc.data().status === "failure") {
              alert(`Sorry, your request was declined.`);
              doc.ref.delete();
            }
          });
        });
    } else {
      // No user is signed in.
    }
  });
}

checkRequests();