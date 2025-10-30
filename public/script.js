// Style options data - Your selected 4 cinema-quality styles
const styles = [
  {
    id: 'egyptian-pharaoh',
    name: 'Egyptian Pharaoh',
    preview: 'style/egyptian-pharaoh-reference.png',
    fallback: 'style/duke-style-reference.jpg',
    description: 'Divine ruler with golden headdress and ceremonial regalia',
    period: 'Ancient Egypt',
    promptSuffix: 'Ancient Egyptian Pharaoh portrait with golden ceremonial headdress featuring cobra insignia, ornate collar with precious stones, golden arm bands, flowing white and gold robes, holding ceremonial ankh staff. Pyramid and sphinx silhouettes at sunset background, golden desert sands, hieroglyphic wall decorations, warm golden lighting, ultra-detailed textures.'
  },
  {
    id: 'roman-gladiator',
    name: 'Roman Gladiator',
    preview: 'style/roman-gladiator-reference.png',
    fallback: 'style/duke-style-reference.jpg',
    description: 'Legendary arena warrior with bronze armor and crimson cape',
    period: 'Ancient Rome',
    promptSuffix: 'Roman gladiator portrait with detailed bronze armor, ornate breastplate with eagle insignia, red leather pteruges (skirt), crimson cape, gladius sword, decorated shield. Standing in Roman Colosseum with sand arena floor, warm golden sunlight, cinematic lighting, ultra-detailed textures.'
  },
  {
    id: 'duke-style',
    name: 'Duke Style Portrait',
    preview: 'style/duke-style-reference.jpg',
    fallback: 'style/duke-style-reference.jpg',
    description: 'Original duke portrait with regal elegance and timeless appeal',
    period: 'Classic Style',
    promptSuffix: 'Classic duke-style portrait with elegant royal attire, regal pose, sophisticated lighting, timeless appeal with rich textures and noble bearing.'
  },
  {
    id: 'renaissance-noble',
    name: 'Renaissance Noble',
    preview: 'style/renaissance-noble-reference.png',
    fallback: 'style/duke-style-reference.jpg',
    description: 'Sophisticated Renaissance scholar with silk doublet and scholarly ambiance',
    period: '15th-16th Century',
    promptSuffix: 'Renaissance noble portrait with rich silk doublet in deep emerald or burgundy, ornate gold chain of office, leather gloves, scholarly background with leather-bound books, astronomical instruments, rolled parchments, soft window lighting creating gentle chiaroscuro effect, Italian Renaissance painting style like Leonardo da Vinci or Raphael.'
  }
];

// App state management 
const state = {
  gender: null,
  selectedStyle: null,
  currentStyleIndex: 0,
  currentStep: 1
};

// DOM elements
const screens = {
  1: document.getElementById('step1'),
  2: document.getElementById('step2'), 
  3: document.getElementById('step3')
};

// Initialize Phase 2
function init() {
  setupBasicNavigation();
  setupGenderSelection();
  buildStyleCarousel();
  setupCarouselNavigation();
  setupCarouselTouch();
  
  // Add keyboard navigation
  document.addEventListener('keydown', handleKeyboard);
  
  showScreen(1);
}

// Basic navigation between screens
function setupBasicNavigation() {
  // Step 2 -> 1
  document.getElementById('back2').addEventListener('click', () => {
    showScreen(1);
  });
  
  // Step 3 -> 2
  document.getElementById('back3').addEventListener('click', () => {
    showScreen(2);
  });
}

// Gender selection logic
function setupGenderSelection() {
  const genderBtns = document.querySelectorAll('.gender-btn');
  const selectedGenderEl = document.getElementById('selected-gender');
  
  genderBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const gender = e.currentTarget.dataset.gender;
      
      // Update state
      state.gender = gender;
      
      // Update UI
      genderBtns.forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      
      // Update selected info for step 3
      selectedGenderEl.textContent = gender.charAt(0).toUpperCase() + gender.slice(1);
      
      // Auto-advance to Step 2 after a brief delay for visual feedback
      setTimeout(() => {
        showScreen(2);
      }, 300);
    });
  });
}

// Build carousel slides dynamically
function buildStyleCarousel() {
  const carouselTrack = document.getElementById('carousel-track');
  
  carouselTrack.innerHTML = styles.map((style, index) => `
    <div class="carousel-slide" data-style-index="${index}" data-style-id="${style.id}">
      <img src="${style.preview}" 
           alt="${style.name} - ${style.period}" 
           class="style-preview" 
           loading="lazy"
           onerror="handleImageError(this, '${style.fallback}')" />
    </div>
  `).join('');
  
  // Add click handlers to slides
  const slides = carouselTrack.querySelectorAll('.carousel-slide');
  slides.forEach(slide => {
    slide.addEventListener('click', handleStyleSelection);
  });
  
  updateCarouselDisplay();
}

// Handle image loading errors with graceful fallback
function handleImageError(img, fallbackSrc) {
  if (img.src !== fallbackSrc) {
    console.warn(`Style image failed to load: ${img.src}, using fallback: ${fallbackSrc}`);
    img.src = fallbackSrc;
  } else {
    // If even fallback fails, use SVG placeholder
    console.error(`Both primary and fallback images failed for style image`);
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDQwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE2Ij5TdHlsZSBSZWZlcmVuY2U8L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE2Ij5JbWFnZTwvdGV4dD4KPHN2ZyB4PSIxNzAiIHk9IjI3MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgcng9IjQiLz4KPGNpcmNsZSBjeD0iMTgiIGN5PSIxNSIgcj0iNCIgZmlsbD0iIzljYTNhZiIvPgo8cGF0aCBkPSJNMTAgMzBMMjAgMjBMMzAgMjVMMzUgMjBMNTAgMzBIMTBaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo8L3N2Zz4K';
    img.alt = 'Style reference image not available';
  }
}

// Handle style selection (auto-advance)
function handleStyleSelection(e) {
  const styleIndex = parseInt(e.currentTarget.dataset.styleIndex);
  const styleId = e.currentTarget.dataset.styleId;
  
  // Update state
  state.selectedStyle = styleId;
  state.currentStyleIndex = styleIndex;
  
  console.log('🎨 Style selected:', styles[styleIndex].name, styleId);
  
  // Update selected info for step 3
  const selectedGenderEl = document.getElementById('selected-gender');
  const selectedStyleEl = document.getElementById('selected-style');
  const genderText = state.gender ? state.gender.charAt(0).toUpperCase() + state.gender.slice(1) : 'None';
  selectedGenderEl.textContent = genderText;
  selectedStyleEl.textContent = styles[styleIndex].name;
  
  // Auto-advance to Step 3 after brief visual feedback
  setTimeout(() => {
    showScreen(3);
  }, 400);
}

// Update carousel display and info
function updateCarouselDisplay() {
  const carouselTrack = document.getElementById('carousel-track');
  const styleCounter = document.getElementById('style-counter');
  const styleName = document.getElementById('style-name');
  const styleDescription = document.getElementById('style-description');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  
  // Update carousel position
  const translateX = -state.currentStyleIndex * 100;
  carouselTrack.style.transform = `translateX(${translateX}%)`;
  
  // Update info display
  const currentStyle = styles[state.currentStyleIndex];
  styleCounter.textContent = `${state.currentStyleIndex + 1} of ${styles.length}`;
  styleName.textContent = currentStyle.name;
  styleDescription.textContent = `${currentStyle.description} • ${currentStyle.period}`;
  
  // Update button states
  prevBtn.disabled = state.currentStyleIndex === 0;
  nextBtn.disabled = state.currentStyleIndex === styles.length - 1;
}

// Carousel navigation functions
function navigateCarousel(direction) {
  const newIndex = state.currentStyleIndex + direction;
  
  if (newIndex >= 0 && newIndex < styles.length) {
    state.currentStyleIndex = newIndex;
    updateCarouselDisplay();
  }
}

function setupCarouselNavigation() {
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  
  prevBtn.addEventListener('click', () => navigateCarousel(-1));
  nextBtn.addEventListener('click', () => navigateCarousel(1));
}

// Touch/swipe support for mobile
function setupCarouselTouch() {
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  
  const container = document.querySelector('.carousel-track-container');
  
  // Touch events
  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });
  
  container.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    
    // Optional: Add visual feedback during swipe
    const diff = startX - currentX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold / 2) {
      container.style.opacity = '0.8';
    }
  }, { passive: true });
  
  container.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    // Reset visual feedback
    container.style.opacity = '1';
    
    const diffX = startX - currentX;
    const threshold = 75; // Minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && state.currentStyleIndex < styles.length - 1) {
        // Swipe left -> next style
        navigateCarousel(1);
      } else if (diffX < 0 && state.currentStyleIndex > 0) {
        // Swipe right -> previous style  
        navigateCarousel(-1);
      }
    }
  }, { passive: true });
  
  // Mouse events for desktop
  container.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
    e.preventDefault();
  });
  
  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX;
    e.preventDefault();
  });
  
  container.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const diffX = startX - currentX;
    const threshold = 100;
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && state.currentStyleIndex < styles.length - 1) {
        navigateCarousel(1);
      } else if (diffX < 0 && state.currentStyleIndex > 0) {
        navigateCarousel(-1);
      }
    }
  });
  
  // Prevent dragging
  container.addEventListener('dragstart', (e) => e.preventDefault());
}

// Screen navigation with transitions
function showScreen(step) {
  // Hide all screens
  Object.values(screens).forEach(screen => {
    screen.classList.remove('active', 'prev');
  });
  
  // Show current screen
  screens[step].classList.add('active');
  
  // Add prev class to previous screens for slide animation
  for (let i = 1; i < step; i++) {
    screens[i].classList.add('prev');
  }
  
  state.currentStep = step;
  
  console.log(`📱 Navigated to Step ${step}`, { gender: state.gender });
}

// Keyboard navigation support
function handleKeyboard(e) {
  // Only handle keyboard on Step 2 (style carousel)
  if (state.currentStep === 2) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (state.currentStyleIndex > 0) {
        navigateCarousel(-1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (state.currentStyleIndex < styles.length - 1) {
        navigateCarousel(1);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Simulate click on current slide
      const currentSlide = document.querySelector(`[data-style-index="${state.currentStyleIndex}"]`);
      if (currentSlide) {
        handleStyleSelection({ currentTarget: currentSlide });
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}