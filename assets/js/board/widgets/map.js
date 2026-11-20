/* --- MAP --- (ported from Semester_Break_Hubv2.html 927-1016)
   Uses the d3 / Datamap globals loaded by index.html. Only change: the resize listener,
   d3.timer and attack interval moved into start(); drawMap exported for the carousel. */
var mapEl = document.getElementById("map-viz");
var proj, path;
var attacks = [];
var ripples = [];
var dm;

export function drawMap() {
    if(mapEl.innerHTML !== "" && !document.getElementById('view-map').classList.contains('active-view')) return;
    mapEl.innerHTML = ""; attacks = []; ripples = [];

    dm = new Datamap({
        element: mapEl,
        projection: 'orthographic',
        setProjection: function(el) {
            var h = el.offsetHeight;
            var w = el.offsetWidth;
            var radius = Math.min(h, w) / 2.2;
            proj = d3.geo.orthographic().scale(radius).translate([w / 2, h / 2]).clipAngle(90);
            path = d3.geo.path().projection(proj);
            d3.select("svg circle").attr("r", radius).attr("cx", w / 2).attr("cy", h / 2);
            return { projection: proj, path: path };
        },
        fills: { defaultFill: '#d0d6db' },
        geographyConfig: { borderColor: '#ffffff', borderWidth: 1, highlightFillColor: '#b8c2cc', highlightBorderColor: '#fff' }
    });

    var svg = d3.select("svg");
    svg.insert("circle", ":first-child").attr("cx", "50%").attr("cy", "50%").attr("r", "1").style("fill", "#e3e9ef");
    window.mapLayer = svg.append("g").attr("id", "attacks");
    window.rippleLayer = svg.append("g").attr("id", "ripples");
    window.labelLayer = svg.append("g").attr("id", "labels");
    window.textElements = window.labelLayer.selectAll("text").data(cityLabels).enter().append("text").attr("class", "city-label").text(d=>d.n).attr("text-anchor","middle");
}

const cityLabels = [
  {n:"PERTH", lat:-31.95, lng:115.86}, {n:"SYDNEY", lat:-33.86, lng:151.20}, {n:"TOKYO", lat:35.68, lng:139.69},
  {n:"BEIJING", lat:39.90, lng:116.40}, {n:"SINGAPORE", lat:1.35, lng:103.81}, {n:"LONDON", lat:51.50, lng:-0.12},
  {n:"NEW YORK", lat:40.71, lng:-74.00}, {n:"SAO PAULO", lat:-23.55, lng:-46.63}
];

export function start() {
    window.addEventListener('resize', function() { clearTimeout(window.resizeTimer); window.resizeTimer = setTimeout(drawMap, 250); });

    var t0 = Date.now();
    d3.timer(function() {
        var t = Date.now() - t0;
        if(proj && document.getElementById('view-map').classList.contains('active-view')) {
            proj.rotate([t * 0.01, -15]);
            d3.selectAll("path.datamaps-subunit").attr("d", path);
            if(window.textElements) {
                window.textElements.each(function(d) {
                    var center = proj.invert([mapEl.offsetWidth / 2, mapEl.offsetHeight / 2]);
                    var dist = d3.geo.distance(center, [d.lng, d.lat]);
                    if(dist < 1.5) {
                        var p = proj([d.lng, d.lat]);
                        d3.select(this).style("display","block").attr("x", p[0]).attr("y", p[1] - 8);
                    } else { d3.select(this).style("display","none"); }
                });
            }
            var lines = window.mapLayer.selectAll("path.attack-line").data(attacks);
            lines.enter().append("path").attr("class", "attack-line").style("fill", "none").style("stroke-linecap","round").style("opacity", 0.8);
            lines.attr("d", path).style("stroke", d => d.color).style("stroke-width", d => d.width).style("stroke-dasharray", d => d.dash).style("stroke-dashoffset", d => -(t * d.speed) % 100);
            lines.exit().remove();
            var circles = window.rippleLayer.selectAll("path.ripple").data(ripples);
            circles.enter().append("path").attr("class","ripple").style("stroke", d=>d.color);
            circles.attr("d", function(d) { return d3.geo.path().projection(proj)(d3.geo.circle().origin([d.lng, d.lat]).angle(d.radius)()); }).style("opacity", d => d.opacity).style("stroke-width", d => (d.opacity * 2) + "px");
            ripples.forEach(r => { r.radius += 0.2; r.opacity -= 0.02; });
            ripples = ripples.filter(r => r.opacity > 0);
        }
    });
    setInterval(launchAttack, 800);
}

function launchAttack() {
    try {
        if(!document.getElementById('view-map').classList.contains('active-view')) return;
        let s = cityLabels[Math.floor(Math.random()*cityLabels.length)];
        let d = cityLabels[Math.floor(Math.random()*cityLabels.length)];
        if(s!==d) {
            let id = Date.now() + Math.random();
            let rand = Math.random();
            let profile;
            if(rand < 0.4)      profile = {color: "#d32f2f", width: 3, dash: "none", speed: 0.15};
            else if(rand < 0.8) profile = {color: "#0056b3", width: 2, dash: "5,5", speed: 0.12};
            else                profile = {color: "#6200ea", width: 2, dash: "2,4", speed: 0.18};
            attacks.push({ type: "Feature", geometry: {type:"LineString", coordinates:[[s.lng,s.lat],[d.lng,d.lat]]}, ...profile, id:id });
            setTimeout(() => { ripples.push({ lat: d.lat, lng: d.lng, radius: 0.5, opacity: 1, color: profile.color }); }, 1000);
            setTimeout(() => attacks = attacks.filter(a => a.id !== id), 2500);
        }
    } catch(e) {}
}
