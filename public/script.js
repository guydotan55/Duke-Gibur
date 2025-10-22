// Simple state management for Phase 1
const state = {
  gender: null,
  selectedStyle: null,
  currentStep: 1
};

// DOM elements
const screens = {
  1: document.getElementById('step1'),
  2: document.getElementById('step2'), 
  3: document.getElementById('step3')
};

// Initialize Phase 1
function init() {
  setupBasicNavigation();
  setupGenderSelection();
  setupStyleSelection();
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

// Style selection logic  
function setupStyleSelection() {
  const styleBtn = document.querySelector('.style-preview-btn');
  
  if (styleBtn) {
    styleBtn.addEventListener('click', (e) => {
      const styleId = e.currentTarget.dataset.styleId;
      
      // Update state (we'll add this when we implement multiple styles)
      state.selectedStyle = styleId;
      
      console.log('📸 Style selected:', styleId);
      
      // Auto-advance to Step 3 after a brief delay for visual feedback
      setTimeout(() => {
        showScreen(3);
      }, 300);
    });
  }
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}