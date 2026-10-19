/* TSiD — site interactions */
(function () {
  "use strict";

  /* ---- Year ---- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Sticky nav shadow + scroll progress ---- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progressBar");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMobile");
  var overlay = document.getElementById("navOverlay");
  function setMenu(open) {
    toggle.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    overlay.addEventListener("click", function () { setMenu(false); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Service filter ---- */
  var filters = document.querySelectorAll(".svc-filter");
  var cards = document.querySelectorAll(".svc");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var f = btn.getAttribute("data-filter");
      cards.forEach(function (c) {
        var show = f === "all" || c.getAttribute("data-cat") === f;
        c.classList.toggle("hide", !show);
      });
    });
  });

  /* ---- Case-study filter ---- */
  var csFilters = document.querySelectorAll(".cs-filter");
  var csCards = document.querySelectorAll(".cs-card");
  csFilters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      csFilters.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var f = btn.getAttribute("data-cs-filter");
      csCards.forEach(function (c) {
        var show = f === "all" || c.getAttribute("data-cs") === f;
        c.classList.toggle("hide", !show);
        if (!show) {
          var v = c.querySelector("video");
          if (v && !v.paused) v.pause();
        }
      });
    });
  });

  /* ---- Only one demo video plays at a time ---- */
  var vids = document.querySelectorAll(".cs-media video");
  vids.forEach(function (v) {
    v.addEventListener("play", function () {
      vids.forEach(function (other) {
        if (other !== v && !other.paused) other.pause();
      });
    });
  });

  /* ---- Pre-select the enquiry topic when arriving from the 3D pavilion (?interest=...) ---- */
  try {
    var want = new URLSearchParams(location.search).get("interest");
    var sel = document.getElementById("interest");
    if (want && sel) {
      var w = want.toLowerCase();
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.toLowerCase().indexOf(w) === 0 || w.indexOf(sel.options[i].text.toLowerCase()) === 0) { sel.selectedIndex = i; break; }
      }
    }
  } catch (e) {}

  /* ---- Contact form (AJAX to /api/contact, graceful fallbacks) ---- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  function setStatus(type, msg) {
    status.className = "form-status show " + type;
    status.innerHTML = msg;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // basic client validation
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();
      if (!name || !email || !message) {
        setStatus("err", "Please fill in your name, email, and a short message.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("err", "That email address doesn't look right — please check it.");
        return;
      }

      var btn = form.querySelector("button[type=submit]");
      var original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "Sending…";
      setStatus("load", "Sending your message…");

      var data = new FormData(form);

      fetch("/api/contact", { method: "POST", body: data, headers: { "X-Requested-With": "fetch" } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j && res.j.success) {
            form.reset();
            setStatus("ok", "Thank you — your message is on its way. We'll be in touch shortly.");
          } else {
            throw new Error((res.j && res.j.error) || "server");
          }
        })
        .catch(function () {
          // Fallback: open the user's email client pre-filled so no lead is ever lost
          var subject = encodeURIComponent("Enquiry from tsid.digital — " + name);
          var body = encodeURIComponent(
            "Name: " + name +
            "\nCompany: " + form.company.value +
            "\nEmail: " + email +
            "\nPhone: " + form.phone.value +
            "\nInterest: " + form.interest.value +
            "\n\n" + message
          );
          setStatus("err",
            "We couldn't send that automatically. " +
            '<a href="mailto:hello@tsid.digital?subject=' + subject + "&body=" + body +
            '" style="color:inherit;text-decoration:underline">Click here to email us instead</a> ' +
            'or <a href="https://wa.me/6580863812" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">message on WhatsApp</a>.'
          );
        })
        .finally(function () {
          btn.disabled = false;
          btn.innerHTML = original;
        });
    });
  }
})();
