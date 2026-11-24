(function () {
  "use strict";

  var STORAGE_KEY = "elysimp-theme";
  var EMAIL_USER = "faldomaxwell123";
  var EMAIL_DOMAIN = "gmail.com";

  /* Verified 2024 BMKG monthly totals (mm) computed directly from raw CSV files in ElySimp/Curah-Hujan-Datasets */
  var BMKG_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var BMKG_MAX_MM = 750;
  var BMKG_DATA = {
    kota_bogor: {
      label: "Kota Bogor",
      monthly: [393.8, 232.8, 723.2, 618.3, 550.6, 223.9, 138.4, 122.7, 402.7, 493.6, 680.4, 232.0],
      annual: "4,812.4 mm",
      rainyValid: "236 / 319",
      peak: "Mar (723.2)",
      maxDay: "146.6 mm (25 May)"
    },
    kab_bogor: {
      label: "Kab. Bogor",
      monthly: [552.5, 547.5, 528.3, 383.1, 184.0, 163.4, 59.9, 54.7, 267.2, 59.2, 461.9, 441.5],
      annual: "3,703.2 mm",
      rainyValid: "215 / 331",
      peak: "Jan (552.5)",
      maxDay: "107.2 mm (25 May)"
    },
    majalengka: {
      label: "Kab. Majalengka",
      monthly: [395.7, 499.1, 365.8, 340.3, 190.4, 325.3, 155.1, 0.0, 125.3, 34.5, 334.4, 153.7],
      annual: "2,919.5 mm",
      rainyValid: "171 / 338",
      peak: "Feb (499.1)",
      maxDay: "90.3 mm (27 Sep)"
    },
    cirebon: {
      label: "Kab. Cirebon",
      monthly: [253.9, 258.2, 497.5, 352.7, 229.0, 54.9, 54.3, 49.7, 188.9, 140.6, 144.0, 244.1],
      annual: "2,467.8 mm",
      rainyValid: "204 / 278",
      peak: "Mar (497.5)",
      maxDay: "128.0 mm (09 Apr)"
    },
    bandung: {
      label: "Kota Bandung",
      monthly: [328.5, 263.0, 275.0, 213.4, 69.8, 156.8, 17.0, 53.2, 135.5, 62.8, 477.6, 89.7],
      annual: "2,142.3 mm",
      rainyValid: "184 / 310",
      peak: "Nov (477.6)",
      maxDay: "63.4 mm (11 Sep)"
    }
  };

  function assembleEmail() {
    return EMAIL_USER + "@" + EMAIL_DOMAIN;
  }

  /* Light/Dark theme persistence */
  function initThemeToggle() {
    var root = document.documentElement;
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var label = btn.querySelector(".theme-label");

    function applyTheme(theme, persist) {
      var isDark = theme === "dark";
      root.setAttribute("data-theme", isDark ? "dark" : "light");
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      if (label) label.textContent = isDark ? "Light" : "Dark";
      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
        } catch (err) {
          /* Ignore storage errors */
        }
      }
    }

    var initial = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(initial, false);

    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  /* Mobile drawer navigation with Escape and focus restoration */
  function initMobileMenu() {
    var menuBtn = document.getElementById("menu-toggle");
    var drawer = document.getElementById("mobile-nav");
    if (!menuBtn || !drawer) return;

    function setOpen(open, restoreFocus) {
      drawer.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      if (!open && restoreFocus) menuBtn.focus();
    }

    menuBtn.addEventListener("click", function () {
      setOpen(menuBtn.getAttribute("aria-expanded") !== "true", false);
    });

    drawer.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false, false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !drawer.hidden) {
        setOpen(false, true);
      }
    });
  }

  /* One-time scroll-reveal for below-the-fold sections (MOTION 2) */
  function initScrollReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    nodes.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Accessible tab switcher for MaoCAT ML models */
  function initModelTabs() {
    var tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });

    function activateTab(index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute("aria-selected", String(selected));
        tab.setAttribute("tabindex", selected ? "0" : "-1");
        if (panels[i]) {
          panels[i].hidden = !selected;
          if (selected) {
            panels[i].classList.remove("is-animated");
            requestAnimationFrame(function () {
              panels[i].classList.add("is-animated");
            });
          } else {
            panels[i].classList.remove("is-animated");
          }
        }
      });
      if (moveFocus && tabs[index]) tabs[index].focus();
    }

    if (panels[0]) panels[0].classList.add("is-animated");

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activateTab(index, false);
      });

      tab.addEventListener("keydown", function (event) {
        var target = null;
        if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") target = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = tabs.length - 1;
        if (target !== null) {
          event.preventDefault();
          activateTab(target, true);
        }
      });
    });
  }

  /* Image view switchers inside HomePoker and Sentiment XAI cards */
  function initImageSwitchers() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-switcher]"));
    boxes.forEach(function (box) {
      var btns = Array.prototype.slice.call(box.querySelectorAll(".sw-btn[data-sw-target]"));
      var panels = Array.prototype.slice.call(box.querySelectorAll(".sw-panel[data-sw-panel]"));

      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var targetId = btn.getAttribute("data-sw-target");
          btns.forEach(function (b) {
            b.setAttribute("aria-pressed", String(b.getAttribute("data-sw-target") === targetId));
          });
          panels.forEach(function (panel) {
            panel.hidden = panel.getAttribute("data-sw-panel") !== targetId;
          });
        });
      });
    });
  }

  /* Project category filtering with empty-state reset */
  function initProjectFilter() {
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter-btn[data-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".visual-project[data-category]"));
    var countEl = document.getElementById("project-count");
    var emptyEl = document.getElementById("projects-empty");
    var resetBtn = document.getElementById("reset-filter-btn");
    if (!filterButtons.length || !cards.length) return;

    function applyFilter(category) {
      var visible = 0;
      cards.forEach(function (card) {
        var match = category === "all" || card.getAttribute("data-category") === category;
        card.hidden = !match;
        if (match) visible += 1;
      });
      filterButtons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-filter") === category));
      });
      if (countEl) countEl.textContent = "Showing " + visible + " of " + cards.length + " projects";
      if (emptyEl) emptyEl.hidden = visible > 0;
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.getAttribute("data-filter"));
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        applyFilter("all");
      });
    }
  }

  /* Animated SVG bar chart for real 2024 BMKG monthly rainfall */
  function initBmkgChart() {
    var barsGroup = document.getElementById("bmkg-bars");
    var stationButtons = Array.prototype.slice.call(document.querySelectorAll(".station-btn[data-station]"));
    var readout = document.getElementById("bmkg-readout");
    var kpiAnnual = document.getElementById("kpi-annual");
    var kpiRainy = document.getElementById("kpi-rainy");
    var kpiPeak = document.getElementById("kpi-peak");
    var kpiMaxDay = document.getElementById("kpi-maxday");
    if (!barsGroup || !stationButtons.length) return;

    var SVG_NS = "http://www.w3.org/2000/svg";
    var plotLeft = 56;
    var plotWidth = 602;
    var baseLineY = 225;
    var maxBarHeight = 185;
    var slotWidth = plotWidth / 12;
    var barWidth = 30;
    var currentStationKey = "kota_bogor";
    var barElements = [];
    var valueLabels = [];

    for (var m = 0; m < 12; m += 1) {
      var x = plotLeft + m * slotWidth + (slotWidth - barWidth) / 2;
      var g = document.createElementNS(SVG_NS, "g");

      var rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("class", "bmkg-bar");
      rect.setAttribute("x", x.toFixed(1));
      rect.setAttribute("y", String(baseLineY - maxBarHeight));
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("height", String(maxBarHeight));
      rect.setAttribute("rx", "3");
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("data-month-index", String(m));
      rect.style.transform = "scaleY(0)";

      var valText = document.createElementNS(SVG_NS, "text");
      valText.setAttribute("class", "bmkg-bar-val");
      valText.setAttribute("x", (x + barWidth / 2).toFixed(1));
      valText.setAttribute("y", "24");
      valText.setAttribute("text-anchor", "middle");
      valText.textContent = "";

      var monthText = document.createElementNS(SVG_NS, "text");
      monthText.setAttribute("class", "bmkg-bar-label");
      monthText.setAttribute("x", (x + barWidth / 2).toFixed(1));
      monthText.setAttribute("y", "246");
      monthText.setAttribute("text-anchor", "middle");
      monthText.textContent = BMKG_MONTHS[m];

      g.appendChild(rect);
      g.appendChild(valText);
      g.appendChild(monthText);
      barsGroup.appendChild(g);
      barElements.push(rect);
      valueLabels.push(valText);

      (function (monthIndex, barNode) {
        function announceBar() {
          var station = BMKG_DATA[currentStationKey];
          if (!station || !readout) return;
          var mm = station.monthly[monthIndex];
          readout.textContent = station.label + " · " + BMKG_MONTHS[monthIndex] + " 2024: " + mm.toFixed(1) + " mm";
        }
        barNode.addEventListener("mouseenter", announceBar);
        barNode.addEventListener("focus", announceBar);
        barNode.addEventListener("click", announceBar);
      })(m, rect);
    }

    function renderStation(key) {
      var station = BMKG_DATA[key];
      if (!station) return;
      currentStationKey = key;

      stationButtons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-station") === key));
      });

      station.monthly.forEach(function (mm, idx) {
        var ratio = Math.max(0.012, Math.min(1, mm / BMKG_MAX_MM));
        if (mm === 0) ratio = 0.01;
        barElements[idx].style.transform = "scaleY(" + ratio.toFixed(4) + ")";
        barElements[idx].setAttribute("aria-label", station.label + " " + BMKG_MONTHS[idx] + " 2024: " + mm.toFixed(1) + " mm");
        var topY = baseLineY - ratio * maxBarHeight - 6;
        valueLabels[idx].setAttribute("y", Math.max(14, topY).toFixed(1));
        valueLabels[idx].textContent = Math.round(mm) === 0 ? "0" : String(Math.round(mm));
      });

      if (kpiAnnual) kpiAnnual.textContent = station.annual;
      if (kpiRainy) kpiRainy.textContent = station.rainyValid;
      if (kpiPeak) kpiPeak.textContent = station.peak;
      if (kpiMaxDay) kpiMaxDay.textContent = station.maxDay;
      if (readout) readout.textContent = station.label + " · Peak: " + station.peak + " mm";
    }

    stationButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        renderStation(btn.getAttribute("data-station"));
      });
    });

    requestAnimationFrame(function () {
      renderStation("kota_bogor");
    });
  }

  /* Accessible fullscreen lightbox across all 10 verified project images */
  function initLightbox() {
    var modal = document.getElementById("lightbox");
    var imgEl = document.getElementById("lightbox-img");
    var capEl = document.getElementById("lightbox-caption");
    var countEl = document.getElementById("lightbox-counter");
    var prevBtn = document.getElementById("lightbox-prev");
    var nextBtn = document.getElementById("lightbox-next");
    var closeBtn = document.getElementById("lightbox-close");
    if (!modal || !imgEl) return;

    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox-src]"));
    var items = [];
    var seen = {};
    triggers.forEach(function (t) {
      var src = t.getAttribute("data-lightbox-src");
      if (src && !seen[src]) {
        seen[src] = true;
        var innerImg = t.querySelector("img");
        items.push({
          src: src,
          alt: innerImg ? innerImg.getAttribute("alt") || "" : "",
          width: innerImg ? innerImg.getAttribute("width") || "" : "",
          height: innerImg ? innerImg.getAttribute("height") || "" : ""
        });
      }
    });

    var activeIndex = 0;
    var lastTrigger = null;

    function showSlide(index) {
      if (!items.length) return;
      activeIndex = (index + items.length) % items.length;
      var item = items[activeIndex];
      imgEl.src = item.src;
      imgEl.alt = item.alt;
      if (item.width) imgEl.setAttribute("width", item.width);
      if (item.height) imgEl.setAttribute("height", item.height);
      if (capEl) capEl.textContent = item.alt;
      if (countEl) countEl.textContent = activeIndex + 1 + " / " + items.length;
    }

    function openModal(src, triggerNode) {
      lastTrigger = triggerNode;
      var foundIdx = 0;
      for (var i = 0; i < items.length; i += 1) {
        if (items[i].src === src) {
          foundIdx = i;
          break;
        }
      }
      showSlide(foundIdx);
      modal.hidden = false;
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        openModal(trigger.getAttribute("data-lightbox-src"), trigger);
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        showSlide(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        showSlide(activeIndex + 1);
      });
    }

    Array.prototype.slice.call(modal.querySelectorAll("[data-lightbox-close]")).forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (event) {
      if (modal.hidden) return;
      if (event.key === "Escape") closeModal();
      else if (event.key === "ArrowLeft") showSlide(activeIndex - 1);
      else if (event.key === "ArrowRight") showSlide(activeIndex + 1);
    });
  }

  /* Client-side email assembly */
  function initContactControls() {
    var statusEl = document.getElementById("contact-status");
    var copyBtn = document.getElementById("copy-email-btn");
    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-contact-email]"));

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var address = assembleEmail();
        window.location.href = "mailto:" + address + "?subject=" + encodeURIComponent("Internship Inquiry");
        if (statusEl) statusEl.textContent = "Opening email client for " + address;
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var address = assembleEmail();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(address).then(
            function () {
              copyBtn.textContent = "Copied";
              if (statusEl) statusEl.textContent = "Copied to clipboard: " + address;
            },
            function () {
              if (statusEl) statusEl.textContent = "Clipboard access blocked. Email: " + address;
            }
          );
        } else if (statusEl) {
          statusEl.textContent = "Email address: " + address;
        }
      });
    }
  }

  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initModelTabs();
  initImageSwitchers();
  initProjectFilter();
  initBmkgChart();
  initLightbox();
  initContactControls();
})();
