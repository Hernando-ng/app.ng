/**
 * Responsive Airbnb Flat Landing Page - Interactive Scripts
 * Lightweight, accessible, and easily customizable
 */

document.addEventListener('DOMContentLoaded', () => {
  // Configuration placeholders - Replace these or edit inline in HTML
  const HOST_CONFIG = {
    flatName: '[FLAT NAME]',
    city: '[CITY / NEIGHBOURHOOD]',
    email: '[EMAIL ADDRESS]',
    whatsappPhone: '[PHONE NUMBER]', // E.g., '15551234567' (digits without + or spaces for wa.me)
  };

  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const primaryNav = document.getElementById('primaryNav');

  if (mobileToggle && primaryNav) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      mobileToggle.classList.toggle('active');
      primaryNav.classList.toggle('is-open');
    });

    // Close menu when clicking navigation links
    const navLinks = primaryNav.querySelectorAll('.nav-link, .nav-cta');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.classList.remove('active');
        primaryNav.classList.remove('is-open');
      });
    });

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && primaryNav.classList.contains('is-open')) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.classList.remove('active');
        primaryNav.classList.remove('is-open');
        mobileToggle.focus();
      }
    });
  }

  // 2. Sticky Header Scroll Shadow & Active Link Observer
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  const highlightNavOnScroll = () => {
    const scrollY = window.pageYOffset + 120;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop;
      const sectionId = current.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navItems.forEach(item => {
          if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNavOnScroll, { passive: true });

  // 3. Dynamic Footer Year
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // 4. Booking Form Datepicker Constraints
  const checkInInput = document.getElementById('checkIn');
  const checkOutInput = document.getElementById('checkOut');

  if (checkInInput && checkOutInput) {
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;

    // Set tomorrow as default minimum checkout
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    checkOutInput.min = tomorrow.toISOString().split('T')[0];

    checkInInput.addEventListener('change', () => {
      if (checkInInput.value) {
        const nextDay = new Date(checkInInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayString = nextDay.toISOString().split('T')[0];
        checkOutInput.min = nextDayString;

        // If checkout is prior to or same as check-in, auto-bump it
        if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
          checkOutInput.value = nextDayString;
        }
      }
    });
  }

  // 5. Booking Enquiry Form Validation & Submission
  const bookingForm = document.getElementById('bookingEnquiryForm');
  const enquiryModal = document.getElementById('enquiryModal');
  const modalClose = document.getElementById('modalClose');
  const emailEnquiryBtn = document.getElementById('emailEnquiryBtn');
  const whatsappEnquiryBtn = document.getElementById('whatsappEnquiryBtn');
  const modalSummary = document.getElementById('modalSummary');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      const fullName = document.getElementById('fullName');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const checkIn = document.getElementById('checkIn');
      const checkOut = document.getElementById('checkOut');
      const guests = document.getElementById('guests');
      const message = document.getElementById('message');

      // Clear previous errors
      const errorElements = bookingForm.querySelectorAll('.form-error');
      errorElements.forEach(el => el.textContent = '');
      const inputs = bookingForm.querySelectorAll('input, select, textarea');
      inputs.forEach(input => input.classList.remove('invalid'));

      // Validate Name
      if (!fullName.value.trim()) {
        showError('nameError', fullName, 'Please enter your full name.');
        isValid = false;
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        showError('emailError', email, 'Please enter a valid email address.');
        isValid = false;
      }

      // Validate Phone
      if (!phone.value.trim() || phone.value.trim().length < 6) {
        showError('phoneError', phone, 'Please enter a valid contact phone number.');
        isValid = false;
      }

      // Validate Dates
      if (!checkIn.value) {
        showError('checkInError', checkIn, 'Please select your check-in date.');
        isValid = false;
      }
      if (!checkOut.value) {
        showError('checkOutError', checkOut, 'Please select your check-out date.');
        isValid = false;
      } else if (checkIn.value && checkOut.value <= checkIn.value) {
        showError('checkOutError', checkOut, 'Check-out date must be after check-in.');
        isValid = false;
      }

      if (!isValid) return;

      // Calculate stay length
      const d1 = new Date(checkIn.value);
      const d2 = new Date(checkOut.value);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Construct Enquiry Message Body
      const enquiryDetails =
`Hello! I would like to enquire about staying at ${HOST_CONFIG.flatName} in ${HOST_CONFIG.city}.

Reservation Details:
- Guest Name: ${fullName.value.trim()}
- Email: ${email.value.trim()}
- Phone: ${phone.value.trim()}
- Check-in: ${checkIn.value}
- Check-out: ${checkOut.value} (${diffDays} night${diffDays > 1 ? 's' : ''})
- Guests: ${guests.value}
${message.value.trim() ? `- Message/Requests: ${message.value.trim()}` : ''}

Looking forward to hearing from you regarding availability!`;

      // Build Mailto link
      const emailSubject = encodeURIComponent(`Booking Enquiry: ${HOST_CONFIG.flatName} (${checkIn.value} - ${checkOut.value})`);
      const emailBody = encodeURIComponent(enquiryDetails);
      const mailtoUrl = `mailto:${HOST_CONFIG.email}?subject=${emailSubject}&body=${emailBody}`;

      // Build WhatsApp link (stripping non-digits from phone placeholder if user provided phone number)
      const cleanPhone = HOST_CONFIG.whatsappPhone.replace(/[^0-9]/g, '');
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(enquiryDetails)}`
        : `https://wa.me/?text=${encodeURIComponent(enquiryDetails)}`;

      if (emailEnquiryBtn) {
        emailEnquiryBtn.href = mailtoUrl;
      }
      if (whatsappEnquiryBtn) {
        whatsappEnquiryBtn.href = waUrl;
      }
      if (modalSummary) {
        modalSummary.textContent = `Enquiry ready for ${fullName.value.trim()} (${diffDays} night${diffDays > 1 ? 's' : ''}, ${guests.value} guest${guests.value > 1 ? 's' : ''}). Click below to send directly via Email or WhatsApp.`;
      }

      // Display Modal
      if (enquiryModal) {
        enquiryModal.classList.add('active');
        enquiryModal.setAttribute('aria-hidden', 'false');
      }
    });
  }

  function showError(errorId, inputElement, messageText) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = messageText;
    }
    inputElement.classList.add('invalid');
  }

  if (modalClose && enquiryModal) {
    modalClose.addEventListener('click', () => {
      enquiryModal.classList.remove('active');
      enquiryModal.setAttribute('aria-hidden', 'true');
    });

    // Close modal on click outside card
    enquiryModal.addEventListener('click', (e) => {
      if (e.target === enquiryModal) {
        enquiryModal.classList.remove('active');
        enquiryModal.setAttribute('aria-hidden', 'true');
      }
    });
  }
});
