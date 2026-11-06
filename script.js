(() => {
  const scene = document.querySelector('.scene');
  const yesButton = document.getElementById('yesButton');
  const noButton = document.getElementById('noButton');
  const celebration = document.getElementById('celebration');
  const successCard = document.getElementById('successCard');
  const inviteCard = document.getElementById('inviteCard');
  const reactionImage = document.getElementById('reactionImage');
  const reactionSources = [
    'assets/reaction-1.png',
    'assets/reaction-2.png',
    'assets/reaction-3.png',
    'assets/reaction-4.png',
    'assets/reaction-5.png'
  ];

  const noMessages = [
    '再考虑一下嘛 🥺',
    '真的不行嘛？🥺',
    '就一起吃个饭嘛～',
    '我请客好不好！'
  ];
  let noClicks = 0;
  let finished = false;
  let safeSpotIndex = -1;
  let isUpdatingChoice = false;

  // Keep strong references to the preloads. In WeChat, anonymous Image
  // objects can be discarded while a click is happening, causing the text to
  // change before the next reaction image has painted.
  const reactionPreloads = reactionSources.map((source) => {
    const image = new Image();
    image.src = source;
    return image;
  });

  function growYesButton() {
    const progress = Math.min(noClicks, 5) / 5;
    const maxWidth = Math.min(window.innerWidth * 0.88, 340);
    const maxHeight = Math.min(window.innerHeight * 0.3, 230);
    const width = 280 + (maxWidth - 280) * progress;
    const height = 56 + (maxHeight - 56) * progress;

    yesButton.style.width = `${Math.round(width)}px`;
    yesButton.style.minHeight = `${Math.round(height)}px`;
    yesButton.style.fontSize = `${18 + progress * 12}px`;
    yesButton.style.transform = 'scale(1)';
  }

  function waitForImage(image) {
    if (image.complete) return Promise.resolve(image.naturalWidth > 0);
    return new Promise((resolve) => {
      image.addEventListener('load', () => resolve(true), { once: true });
      image.addEventListener('error', () => resolve(false), { once: true });
    });
  }

  async function updateReactionImage(nextClickCount) {
    const imageNumber = Math.min(nextClickCount + 1, 5);
    const preload = reactionPreloads[imageNumber - 1];
    const loaded = await waitForImage(preload);
    if (!loaded) return false;

    try {
      if (preload.decode) await preload.decode();
      reactionImage.src = preload.src;
      // Do not update any button state until the replacement image has also
      // decoded. This keeps the picture and option change in the same frame.
      if (reactionImage.decode) await reactionImage.decode();
    } catch {
      return false;
    }

    reactionImage.alt = imageNumber === 5 ? '委屈哭泣的小猫' : '可爱的猫咪表情';
    reactionImage.classList.remove('is-changing');
    void reactionImage.offsetWidth;
    reactionImage.classList.add('is-changing');
    return true;
  }

  function moveNoButton() {
    const width = noButton.offsetWidth || 112;
    const height = noButton.offsetHeight || 38;
    const cardRect = inviteCard.getBoundingClientRect();
    const inset = 14;
    // Coordinates below are local to .invite-card (not the mobile screen),
    // so the rejection button is physically unable to leave the white card.
    const minLeft = inset;
    const minTop = inset;
    const maxLeft = Math.max(minLeft, cardRect.width - width - inset);
    const maxTop = Math.max(minTop, cardRect.height - height - inset);
    const yesRect = yesButton.getBoundingClientRect();
    const clampLeft = (value) => Math.min(maxLeft, Math.max(minLeft, value));
    const clampTop = (value) => Math.min(maxTop, Math.max(minTop, value));
    const yesTop = yesRect.top - cardRect.top;
    const yesBottom = yesRect.bottom - cardRect.top;
    // Four fixed, card-local spots around the main choice. The card itself
    // moves with the page, but these points can never be below the card.
    const safeSpots = [
      [minLeft, yesBottom + 10],
      [maxLeft, yesBottom + 10],
      [maxLeft, yesTop - height - 12],
      [minLeft, yesTop - height - 12]
    ].map(([left, top]) => [clampLeft(left), clampTop(top)]);
    safeSpotIndex = (safeSpotIndex + 1) % safeSpots.length;
    const [left, top] = safeSpots[safeSpotIndex];

    noButton.style.left = `${Math.round(left)}px`;
    noButton.style.top = `${Math.round(top)}px`;
  }

  async function updateChoices() {
    if (isUpdatingChoice || finished) return;
    isUpdatingChoice = true;
    noButton.disabled = true;
    const nextClickCount = noClicks + 1;

    try {
      const imageUpdated = await updateReactionImage(nextClickCount);
      // If the image cannot be loaded, leave the existing choice untouched.
      // A retry stays visually truthful rather than showing a mismatched state.
      if (!imageUpdated) return;

      noClicks = nextClickCount;
      growYesButton();

      if (noClicks < 5) {
        noButton.textContent = noMessages[noClicks - 1];
        noButton.style.opacity = `${1 - noClicks * 0.05}`;
        if (noClicks >= 2) {
          noButton.classList.add('is-chasing');
          const compactWidth = Math.max(112, 250 - noClicks * 38);
          noButton.style.width = `${compactWidth}px`;
          noButton.style.minHeight = `${Math.max(40, 56 - noClicks * 4)}px`;
          noButton.style.fontSize = `${Math.max(13, 17 - noClicks)}px`;
          noButton.style.transform = 'none';
          moveNoButton();
        } else {
          noButton.style.transform = 'scale(.92)';
        }
        return;
      }

      noButton.textContent = '快哭了 😭';
      noButton.classList.add('is-chasing', 'is-running');
      noButton.style.transform = 'none';
      noButton.style.opacity = '.86';
      moveNoButton();
    } finally {
      noButton.disabled = false;
      isUpdatingChoice = false;
    }
  }

  function sprinkle(count = 30) {
    const pieces = ['♥', '❤', '✦', '✧', '❀', '🌸'];
    const colors = ['#ef7896', '#f6a4b8', '#f0bf72', '#ffffff', '#d86b8a'];
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
      piece.style.setProperty('--left', `${Math.random() * 100}%`);
      piece.style.setProperty('--size', `${14 + Math.random() * 18}px`);
      piece.style.setProperty('--duration', `${2.5 + Math.random() * 2.2}s`);
      piece.style.setProperty('--delay', `${Math.random() * .8}s`);
      piece.style.setProperty('--drift', `${-80 + Math.random() * 160}px`);
      piece.style.setProperty('--spin', `${-220 + Math.random() * 440}deg`);
      piece.style.color = colors[Math.floor(Math.random() * colors.length)];
      celebration.appendChild(piece);
      window.setTimeout(() => piece.remove(), 5600);
    }
  }

  function acceptInvite() {
    if (finished) return;
    finished = true;
    scene.classList.add('is-success');
    successCard.setAttribute('aria-hidden', 'false');
    sprinkle(44);
    window.setTimeout(() => sprinkle(16), 720);
  }

  noButton.addEventListener('click', updateChoices);
  yesButton.addEventListener('click', acceptInvite);
  window.addEventListener('resize', () => {
    if (noClicks >= 2) moveNoButton();
  });
  window.visualViewport?.addEventListener('resize', () => {
    if (noClicks >= 2) moveNoButton();
  });
  window.visualViewport?.addEventListener('scroll', () => {
    if (noClicks >= 2) moveNoButton();
  });
})();

