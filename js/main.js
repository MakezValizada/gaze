//init variables
let currencyCode;
let border;
let countryName;
let CountrySpecial;
let capitalCityLat;
let capitalCityLon;
let iso_a2;
let cachedCountries = [];
let popup;

//current location vars
let currentLat;
let currentLng;
let currentCapital;

let capitalLat;
let capitalLng;
let capitalCity;
let countryOptionText;

//maps construct

let east;
let west;
let north;
let south;
let marker;

// Leaflet Map init()
const map = L.map("map", {
  zoom: 10,
  maxZoom: 19,
}).fitWorld();

const layerGroup = L.markerClusterGroup().addTo(map);

const tiles = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://basemaps.cartocdn.com/">Base Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }
).addTo(map);

//Icons

var redMarker = L.ExtraMarkers.icon({
  icon: "fa-landmark",
  markerColor: "blue",
  shape: "square",
  prefix: "fa",
});

//EarthQuake marker
var earthQuakeMarker = L.ExtraMarkers.icon({
  icon: "fa-bullseye",
  markerColor: "red",
  shape: "square",
  prefix: "fa",
});

//windy webcam marker
var camMarker = L.ExtraMarkers.icon({
  icon: "fa-camera",
  markerColor: "pink",
  shape: "square",
  prefix: "fas",
});

// Marker Cluster
var markers = L.markerClusterGroup();

//Selector Dropdown
$.ajax({
  url: "./php/getCountrySelect.php",
  type: "POST",
  dataType: "json",

  success: function (result) {
    if (result.status.name == "ok") {
      for (var i = 0; i < result.data.length; i++) {
        $("#selCountry").append(
          $("<option>", {
            value: result.data[i].code,
            text: result.data[i].name,
          })
        );
      }
    }
  },
  error: function (jqXHR, textStatus, errorThrown) {
    // console.log(textStatus, errorThrown);
    // console.log(jqXHR.responseText);
  },
});

// call OpenCage API
const getBorders = (position) => {
  $.ajax({
    url: "./php/openCage.php",
    type: "GET",
    dataType: "json",
    data: {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    },

    success: function (result) {
      currentLat = result.data[0].geometry.lat;
      currentLng = result.data[0].geometry.lng;

      $("selectOpt select").val(
        result.data[0].components["ISO_3166-1_alpha-2"]
      );

      let currentCountry = result.data[0].components["ISO_3166-1_alpha-2"];
      $("#selCountry").val(currentCountry).change();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      // console.log(textStatus, errorThrown);
      // console.log(jqXHR.responseText);
    },
  });
};

const getBordersErrors = (error) => {
  // console.error(error);
};

//get user location via OpenCage API
navigator.geolocation.getCurrentPosition(getBorders, getBordersErrors);

// Border
$("#selCountry").on("change", function () {
  let iso_a2 = $("#selCountry").val();
  let countryOptionText = $("#selCountry").find("option:selected").text();
  layerGroup.clearLayers();

  // Cache already selected countries
  if (!cachedCountries.includes(countryOptionText)) {
    cachedCountries.push(countryOptionText);
  }

  //Webcams data from Windy API
  $.ajax({
    url: "./php/webcams.php",
    dataType: "json",
    type: "POST",
    data: {
      country: iso_a2,
    },
    success: function (result) {
      result.data.result.webcams.forEach((webcams) => {
        const newMarker = L.marker(
          [webcams.location.latitude, webcams.location.longitude],
          {
            icon: camMarker,
            type: "webcam",
            title: webcams.title,
            latitude: webcams.location.latitude,
            longitude: webcams.location.longitude,
          }
        )
          .addTo(layerGroup)
          .on("click", function (e) {
            newMarker
              .bindPopup(
                "<strong class='title'>Webcam</strong><hr>" +
                  webcams.title +
                  "<br><br><iframe width='200' height='200' src='" +
                  webcams.player.day.embed +
                  "'></iframe>"
              )
              .openPopup();
            newMarker.unbindPopup();
          });
      });
    },
    error: function (jqXHR, textStatus, errorThrown) {},
  });

  // Get Cities
  $.ajax({
    url: "./php/cities.php",
    dataType: "json",
    type: "POST",
    data: {
      country: iso_a2,
    },
    success: function (result) {
      const marker = L.ExtraMarkers.icon({
        icon: " fa-location-arrow",
        markerColor: "#BBDEF0",
        shape: "square",
        svg: true,
        prefix: "fa",
      });
      const capitalMarker = L.ExtraMarkers.icon({
        icon: " fa-location-arrow",
        markerColor: "#2C95C9",
        shape: "star",
        svg: true,
        prefix: "fa",
      });
      result["data"].forEach((city) => {
        //Check if the city is the capital
        if (city.fcode == "PPLC") {
          //Change marker to indicate the capital
          const newMarker = L.marker([city.lat, city.lng], {
            icon: redMarker,
            type: "city",
            name: city.name,
            population: city.population,
            latitude: city.lat,
            longitude: city.lng,
            capital: true,
            geonameId: city.geonameId,
          })
            .addTo(layerGroup)
            .on("click", function (e) {
              console.log("click click");
              newMarker
                .bindPopup(
                  "<strong  class='title' >" +
                    city.name +
                    "</strong>" +
                    "<br>(Capital City)" +
                    "<br>Population: " +
                    city.population.toLocaleString("en-us") +
                    "<br><a href='https://en.wikipedia.org/wiki/" +
                    result.capital +
                    "' target='_blank' ><img class='wiki-icon' src='img/wikipedia.svg' alt='Wikipedia'></a>"
                )
                .openPopup();
              newMarker.unbindPopup();
            });
        } else {
          var newMarker = L.marker([city.lat, city.lng], {
            icon: marker,
            name: city.name,
            population: city.population,
          })
            .addTo(layerGroup)
            .on("click", function (e) {
              console.log("city clicked");

              newMarker
                .bindPopup(
                  "<strong class ='title'>" +
                    city.name +
                    "</strong>" +
                    "<br>Population: " +
                    city.population.toLocaleString("en-US") +
                    "<br><a href='https://en.wikipedia.org/wiki/" +
                    city.name +
                    "' target='_blank' style='font-weight=300;'><img class='wiki-icon' src='img/wikipedia.svg' alt='Wiki Link'> </a>"
                )
                .openPopup();
              newMarker.unbindPopup();
            });
        }
      });
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(textStatus, errorThrown);
      console.log(jqXHR.responseText);
    },
  });

  //Points of Interest

  $.ajax({
    url: "./php/poi.php",
    dataType: "json",
    type: "POST",
    data: {
      countryCode: iso_a2,
    },
  }).done((result) => {
    console.log("POI Working");
    const marker = L.ExtraMarkers.icon({
      icon: "fa-binoculars",
      markerColor: "#AFD5AA",
      shape: "penta",
      svg: true,
      prefix: "fa",
    });
    result["data"].forEach((poi) => {
      const newMarker = L.marker([poi.lat, poi.lng], {
        icon: marker,
        name: poi.name,
        latitude: poi.lat,
        longitude: poi.lng,
        type: "monument",
      })
        .addTo(layerGroup)
        .on("click", function (e) {
          console.log("click POI");
          newMarker
            .bindPopup(
              "<strong class='title'>Point of Interest" +
                "</strong><br><strong>" +
                poi.name +
                "</strong>" +
                "<br><a href='https://en.wikipedia.org/wiki/" +
                poi.name +
                "' target='_blank'><img class='wiki-icon' src='img/wikipedia.svg' alt='Wiki Link'></a>"
            )
            .openPopup();
          newMarker.unbindPopup();
        });
    });
  });

  // Get Earthquake Datay
  $.ajax({
    url: "./php/countryInfo.php",
    dataType: "json",
    type: "POST",
    data: {
      country: iso_a2,
    },
    success: function (result) {
      north = result.data[0].north;
      south = result.data[0].south;
      west = result.data[0].west;
      east = result.data[0].east;

      $.ajax({
        url: "./php/earthquakes.php",
        dataType: "json",
        type: "POST",
        data: {
          north: north,
          south: south,
          east: east,
          west: west,
        },
        success: function (result) {
          result["data"].forEach((quake) => {
            const newerMarker = L.marker([quake.lat, quake.lng], {
              icon: earthQuakeMarker,
              name: quake.name,
              latitude: quake.lat,
              longitude: quake.lng,
              date: quake.datetime,
              mag: quake.magnitude,
              type: "quake",
            })
              .addTo(layerGroup)
              .on("click", function (e) {
                newerMarker
                  .bindPopup(
                    "<strong class='title'>Magnitude:</strong><br>" +
                      quake.magnitude +
                      "<br><strong>Date:</strong> " +
                      "<br>" +
                      Date.parse(quake.datetime).toString().slice(3, 7) +
                      Date.parse(quake.datetime).toString().slice(10, 15)
                  )
                  .openPopup();
                newerMarker.unbindPopup();
              });
          });
        },
      });
    },
  });

  //Home Default
  const showFirstTab = function () {
    $("#nav-home-tab").tab("show");
  };
  showFirstTab();

  $.ajax({
    url: "./php/geoJson.php",
    type: "POST",
    dataType: "json",
    data: {
      iso_a2: $("#selCountry").val(),
    },

    success: function (result) {
      if (map.hasLayer(border)) {
        map.removeLayer(border);
      }

      let countryArray = result.data;
      let countryOptionTextArray = [];

      border = L.geoJSON(countryArray[0], {
        color: "red",
        weight: 2,
        opacity: 0.75,
      }).addTo(map);
      let bounds = border.getBounds();
      map.fitBounds(bounds, {
        padding: [35, 35],
        duration: 2,
      });
    },

    error: function (jqXHR, textStatus, errorThrown) {
      // your error code
      console.log(textStatus, errorThrown);
      console.log(jqXHR.responseText);
    },
  });

  $.ajax({
    url: "./php/restCountries.php",
    type: "POST",
    dataType: "json",
    data: {
      country: $("#selCountry").val(),
    },
    success: function (result) {
      console.log("restCountries", result);
      if (result.status.name == "ok") {
        currencyCode = result.currency.code;
        currentCapital = result.capital;
        var CountrySpecial = result.name;
        countryName = CountrySpecial.replace(/\s+/g, "_");
        console.log(currentCapital);
      }

      //openWeather API
      $.ajax({
        url: "./php/openWeather.php",
        type: "POST",
        dataType: "json",
        data: {
          capital: currentCapital,
        },
        success: function (result) {
          console.log("currentCapital", result);
          capitalCityLat = result.weatherData.coord.lat;
          capitalCityLon = result.weatherData.coord.lon;
          if (result.status.name == "ok") {
          }
        },

        error: function (jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
          console.log(errorThrown);
        },
      });
    },
  });

  $("#country-code").html("<td>" + $("#selCountry").val() + "</td>");
  $.ajax({
    url: "./php/restCountries.php",
    type: "POST",
    dataType: "json",
    data: {
      country: $("#selCountry").val(),
    },
    success: function (result) {
      if (result.status.name == "ok") {
        currencyCode = result.currency.code;
        currentCapital = result.capital;
        var CountrySpecial = result.name;
        countryName = CountrySpecial.replace(/\s+/g, "_");
        console.log(currentCapital);
        console.log(CountrySpecial);

        $("#country-capital").html("<td>" + result.capital + "</td>");
        $("#country-population").html(
          "<td>" + result.population.toLocaleString("en-US") + "</td>"
        );
        $("#country-currency").html("<td>" + result.currency.name + "</td>");
        $("#currency-code").html("<td>" + result.currency.code + "</td>");
        $("#currency-symbol").html("<td>" + result.currency.symbol + "</td>");
        $("#country-language").html("<td>" + result.language.name + "</td>");
        $("#calling-codes").html("<td>+" + result.callingCodes + "</td>");
        //Wiki link
        document.getElementById("myLink").href =
          "https://en.wikipedia.org/wiki/" + countryName;

        if (
          CountrySpecial ===
          `United Kingdom of Great Britain and Northern Ireland`
        ) {
          CountrySpecial = "UK";
        }
      }

      //openWeather API
      $.ajax({
        url: "./php/openWeather.php",
        type: "POST",
        dataType: "json",
        data: {
          capital: currentCapital,
        },
        success: function (result) {
          // console.log("currentCapital", result);
          capitalCityLat = result.weatherData.coord.lat;
          capitalCityLon = result.weatherData.coord.lon;

          if (result.status.name == "ok") {
            $("#country-weather").html(
              "<td id=weather>" +
                result.weatherData.weather[0].description +
                "</td>"
            );
            $("#country-temp").html(
              "<td id=weather>" + result.weatherData.main.temp + "°C</td>"
            );
            $("#feels-like").html(
              "<td id=weather>" + result.weatherData.main.feels_like + "°C</td>"
            );

            $("#today-weather-type").html(
              result.weatherData.weather[0].description +
                "<hr> <p>Current Temp: " +
                result.weatherData.main.temp +
                "°C </p> <p>Feels Like: " +
                result.weatherData.main.feels_like +
                "°C </p>"
            );
          }
        },

        error: function (jqXHR, textStatus, errorThrown) {
          console.log(jqXHR.responseText);
          console.log(errorThrown);
        },
      });
    },
  });

  $.ajax({
    url: "./php/covid.php",
    type: "POST",
    dataType: "json",
    data: {
      country: $("#selCountry").val(),
    },
    success: function (result) {
      $("#modal-body").html(
        '<div class="preloader"> <img class="preloader-icon" src="img/loader.gif" alt="Site Preloader"/> </div>'
      );
      console.log("covid data", result);
      if (result.status.name == "ok") {
        $("#total-cases").html(
          "<td>" + result.data[0].toLocaleString("en-US") + "</td>"
        );
        $("#total-deaths").html(
          "<td>" + result.data[1].toLocaleString("en-US") + "</td>"
        );

        if (result.data[2] === 0) {
          $("#total-recovered").html("<td><p>Data Not Yet Published</p></td>");
        } else {
          $("#total-recovered").html(
            "<td>" + result.data[2].toLocaleString("en-US") + "</td>"
          );
        }
        $("#new-confirmed").html(
          "<td>" + result.data[3].toLocaleString("en-US") + "</td>"
        );
        $("#new-deaths").html(
          "<td>" + result.data[4].toLocaleString("en-US") + "</td>"
        );
        if (result.data[5] === 0) {
          $("#new-recovered").html("<td><p>Data Not Yet Published</p></td>");
        } else {
          $("#new-recovered").html(
            "<td>" + result.data[5].toLocaleString("en-US") + "</td>"
          );
        }
        $(".preloader").hide();
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      // your error code
      console.log(textStatus, errorThrown);
      console.log(jqXHR.responseText);
    },
  });

  $("#holiday-body").empty(),
    $.ajax({
      url: "./php/holidays.php",
      type: "POST",
      dataType: "json",
      data: {
        country: $("#selCountry").val(),
      },
      success: function (result) {
        console.log("holiday data", result);
        if (result.status.name == "ok") {
          if (result.data.totalResults === 0) {
            $("#holiday-body").append(
              '\n<article class="no-news">\n<h4>No News Found for the selected country</h4>\n</article>\n'
            );
          } else {
            for (let i = 0; i < 100; i++) {
              $("#holiday-body").append(
                `<tr><td>` +
                  Date.parse(result.data.holidays[i].observed)
                    .toString()
                    .slice(4, 10) +
                  `</td><td>` +
                  result.data.holidays[i].name +
                  `</td></tr>`
              );
            }
          }
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // your error code
        console.log(textStatus, errorThrown);
        console.log(jqXHR.responseText);
      },
    });

  $("#news-body").empty(),
    $.ajax({
      url: "./php/news.php",
      type: "POST",
      dataType: "json",
      data: {
        country: $("#selCountry").val(),
      },
      success: function (result) {
        console.log("news data", result);
        if (result.status.name == "ok") {
          if (result.data.totalResults === 0) {
            $("#news-body").append(
              '\n<article class="no-news">\n<h4>No News from the selected country</h4>\n</article>\n'
            );
          } else {
            for (let i = 0; i < 10; i++) {
              if (!result.data.articles[i].urlToImage) {
                $("#news-body").append(
                  `<div class="card news-card"><img class="card-img-top news-img" src="img/news.jpg" alt="article image"><div class="card-body"><h5 class="card-title">${result.data.articles[i].title}</h5><p class="card-text">${result.data.articles[i].description}</p><a href=${result.data.articles[i].url} target="_blank" class="card-link">Read More</a></div></div>`
                );
              } else {
                $("#news-body").append(
                  `<div class="card news-card"><img class="card-img-top news-img" src="${result.data.articles[i].urlToImage}" alt="article image"><div class="card-body"><h5 class="card-title">${result.data.articles[i].title}</h5><p class="card-text">${result.data.articles[i].description}</p><a href=${result.data.articles[i].url} target="_blank" class="card-link">Read More</a></div></div>`
                );
              }
            }
          }
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // your error code
        console.log(textStatus, errorThrown);
        console.log(jqXHR.responseText);
      },
    });

  $.ajax({
    url: "./php/weather.php",
    type: "POST",
    dataType: "json",
    data: {
      lat: capitalCityLat,
      lng: capitalCityLon,
    },
    success: function (result) {
      console.log("weather data", result);
      if (result.status.name == "ok") {
        $("#today-weather-icon").attr(
          "src",
          `http://openweathermap.org/img/w/` +
            result.weatherForcast.daily[1].weather[0].icon +
            `.png`
        ),
          $("#plus-one-date").html("Tomorrow"),
          $("#plus-one-weather-icon").attr(
            "src",
            `http://openweathermap.org/img/w/` +
              result.weatherForcast.daily[2].weather[0].icon +
              `.png`
          ),
          $("#plus-one-max-temp").html(
            "Max Temp:<br>" + result.weatherForcast.daily[1].temp.max + "°C"
          ),
          $("#plus-one-min-temp").html(
            "Min Temp:<br>" + result.weatherForcast.daily[1].temp.min + "°C"
          ),
          $("#plus-two-date").html("3rd Day"),
          $("#plus-two-weather-icon").attr(
            "src",
            `http://openweathermap.org/img/w/` +
              result.weatherForcast.daily[3].weather[0].icon +
              `.png`
          ),
          $("#plus-two-max-temp").html(
            "Max Temp:<br>" + result.weatherForcast.daily[2].temp.max + "°C"
          ),
          $("#plus-two-min-temp").html(
            "Min Temp:<br>" + result.weatherForcast.daily[2].temp.min + "°C"
          ),
          $("#plus-three-date").html("4th Day"),
          $("#plus-three-weather-icon").attr(
            "src",
            `http://openweathermap.org/img/w/` +
              result.weatherForcast.daily[4].weather[0].icon +
              `.png`
          ),
          $("#plus-three-max-temp").html(
            "Max Temp:<br>" + result.weatherForcast.daily[3].temp.max + "°C"
          ),
          $("#plus-three-min-temp").html(
            "Min Temp:<br>" + result.weatherForcast.daily[3].temp.min + "°C"
          ),
          $("#plus-four-date").html("Fifth Day"),
          $("#plus-four-weather-icon").attr(
            "src",
            `http://openweathermap.org/img/w/` +
              result.weatherForcast.daily[5].weather[0].icon +
              `.png`
          ),
          $("#plus-four-max-temp").html(
            "Max Temp:<br>" + result.weatherForcast.daily[4].temp.max + "°C"
          ),
          $("#plus-four-min-temp").html(
            "Min Temp:<br>" + result.weatherForcast.daily[4].temp.min + "°C"
          );
      }
    },
  });

  //Preloader
  $(".preloader").hide();
});

//Modal Apis

//Info Modal
L.easyButton({
  id: "info-button",
  position: "topleft",
  states: [
    {
      stateName: "get-country-info",
      onClick: function () {
        $("#exampleModal").modal("show");

        if ($(".flag-image").length > 0) {
          $(".flag-image").empty();
        }

        $(".flag-image").append(
          `<img src="./img/flags/` +
            $("#selCountry").val().toLowerCase() +
            `.svg"width="100%"alt="Country Flag">`
        );
      },
      icon: "fa-info",
    },
  ],
}).addTo(map);

//COVID Modal
L.easyButton({
  id: "covid-button",
  position: "topleft",
  states: [
    {
      stateName: "get-covid-info",
      onClick: function () {
        $("#covidModal").modal("show");
      },
      icon: "fa-virus",
    },
  ],
}).addTo(map);

//Holiday Modal
L.easyButton({
  id: "holiday-button",
  position: "topleft",
  states: [
    {
      stateName: "get-holiday-info",
      onClick: function () {
        $("#holidayModal").modal("show");
      },
      icon: "fa-glass-cheers",
    },
  ],
}).addTo(map);

//News Modal
L.easyButton({
  id: "news-button",
  position: "topleft",
  states: [
    {
      stateName: "get-news-info",
      onClick: function () {
        $("#newsModal").modal("show");
      },
      icon: "fa-newspaper",
    },
  ],
}).addTo(map);

//Weather Modal
L.easyButton({
  id: "weather-button",
  position: "topleft",
  states: [
    {
      stateName: "get-weather-info",
      onClick: function () {
        $("#weatherModal").modal("show");
        $.ajax({
          url: "./php/weather.php",
          type: "POST",
          dataType: "json",
          data: {
            lat: capitalCityLat,
            lng: capitalCityLon,
          },
          success: function (result) {
            console.log("weather data", result);
            if (result.status.name == "ok") {
              $("#today-weather-icon").attr(
                "src",
                `http://openweathermap.org/img/w/` +
                  result.weatherForcast.daily[1].weather[0].icon +
                  `.png`
              ),
                $("#plus-one-date").html("Tomorrow"),
                $("#plus-one-weather-icon").attr(
                  "src",
                  `http://openweathermap.org/img/w/` +
                    result.weatherForcast.daily[2].weather[0].icon +
                    `.png`
                ),
                $("#plus-one-max-temp").html(
                  "Max Temp:<br>" +
                    result.weatherForcast.daily[1].temp.max +
                    "°C"
                ),
                $("#plus-one-min-temp").html(
                  "Min Temp:<br>" +
                    result.weatherForcast.daily[1].temp.min +
                    "°C"
                ),
                $("#plus-two-date").html("Third Day"),
                $("#plus-two-weather-icon").attr(
                  "src",
                  `http://openweathermap.org/img/w/` +
                    result.weatherForcast.daily[3].weather[0].icon +
                    `.png`
                ),
                $("#plus-two-max-temp").html(
                  "Max Temp:<br>" +
                    result.weatherForcast.daily[2].temp.max +
                    "°C"
                ),
                $("#plus-two-min-temp").html(
                  "Min Temp:<br>" +
                    result.weatherForcast.daily[2].temp.min +
                    "°C"
                ),
                $("#plus-three-date").html("Fourth Day"),
                $("#plus-three-weather-icon").attr(
                  "src",
                  `http://openweathermap.org/img/w/` +
                    result.weatherForcast.daily[4].weather[0].icon +
                    `.png`
                ),
                $("#plus-three-max-temp").html(
                  "Max Temp:<br>" +
                    result.weatherForcast.daily[3].temp.max +
                    "°C"
                ),
                $("#plus-three-min-temp").html(
                  "Min Temp:<br>" +
                    result.weatherForcast.daily[3].temp.min +
                    "°C"
                ),
                $("#plus-four-date").html("Fifth Day"),
                $("#plus-four-weather-icon").attr(
                  "src",
                  `http://openweathermap.org/img/w/` +
                    result.weatherForcast.daily[5].weather[0].icon +
                    `.png`
                ),
                $("#plus-four-max-temp").html(
                  "Max Temp:<br>" +
                    result.weatherForcast.daily[4].temp.max +
                    "°C"
                ),
                $("#plus-four-min-temp").html(
                  "Min Temp:<br>" +
                    result.weatherForcast.daily[4].temp.min +
                    "°C"
                );
            }
          },
          error: function (jqXHR, textStatus, errorThrown) {
            // your error code
            console.log(textStatus, errorThrown);
            console.log(jqXHR.responseText);
          },
        });
      },
      icon: "fas fa-cloud-meatball",
    },
  ],
}).addTo(map);

console.log(CountrySpecial);
