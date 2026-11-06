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

  // Keep later reactions downloaded and decoded before the first tap so the
  // visible image can swap on the same interaction frame.
  reactionSources.slice(1).forEach((source) => {
    const preload = new Image();
    preload.src = source;
    if (preload.decode) preload.decode().catch(() => {});
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

  function updateReactionImage() {
    const imageNumber = Math.min(noClicks + 1, 5);
    reactionImage.src = reactionSources[imageNumber - 1];
    reactionImage.alt = imageNumber === 5 ? '委屈哭泣的小猫' : '可爱的猫咪表情';
    reactionImage.classList.remove('is-changing');
    void reactionImage.offsetWidth;
    reactionImage.classList.add('is-changing');
  }

  function moveNoButton() {
    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;
    const viewportLeft = viewport?.offsetLeft || 0;
    const viewportTop = viewport?.offsetTop || 0;
    const sidePadding = 14;
    const topPadding = 18;
    const bottomPadding = 28;
    const width = noButton.offsetWidth || 112;
    const height = noButton.offsetHeight || 38;
    const cardRect = inviteCard.getBoundingClientRect();
    const cardInset = 14;
    // The usable rectangle is the part of the *white invite card* that is
    // still on screen. This is deliberately stricter than viewport-only
    // clamping: the button can never escape below or beside the card.
    const minLeft = Math.max(viewportLeft + sidePadding, cardRect.left + cardInset);
    const minTop = Math.max(viewportTop + topPadding, cardRect.top + cardInset);
    const maxLeft = Math.max(
      minLeft,
      Math.min(viewportLeft + viewportWidth - width - sidePadding, cardRect.right - width - cardInset)
    );
    const maxTop = Math.max(
      minTop,
      Math.min(viewportTop + viewportHeight - height - bottomPadding, cardRect.bottom - height - cardInset)
    );
    const yesRect = yesButton.getBoundingClientRect();
    const clampLeft = (value) => Math.min(maxLeft, Math.max(minLeft, value));
    const clampTop = (value) => Math.min(maxTop, Math.max(minTop, value));
    // Keep every chase position inside the large “好呀” button. It is both
    // close to the choice and guaranteed to stay within the white card.
    const inset = 10;
    const safeSpots = [
      [yesRect.left + inset, yesRect.top + inset],
      [yesRect.right - width - inset, yesRect.top + inset],
      [yesRect.right - width - inset, yesRect.bottom - height - inset],
      [yesRect.left + inset, yesRect.bottom - height - inset]
    ].map(([left, top]) => [clampLeft(left), clampTop(top)]);
    safeSpotIndex = (safeSpotIndex + 1) % safeSpots.length;
    const [left, top] = safeSpots[safeSpotIndex];

    noButton.style.left = `${Math.round(left)}px`;
    noButton.style.top = `${Math.round(top)}px`;
  }

  function updateChoices() {
    noClicks += 1;
    updateReactionImage();
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

