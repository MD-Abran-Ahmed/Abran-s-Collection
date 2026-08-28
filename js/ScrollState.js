import { ROTATION_END, SECTION_HEIGHT_VH } from './config.js';

/**
 * Turns raw window.scrollY into a small state object describing which car
 * is active, how far through its rotation/detail sequence we are, and how
 * far through its exit/entry transition we are. Pure function of scrollY —
 * easy to reason about and easy to unit test.
 */
export class ScrollState {
  constructor(carCount) {
    this.carCount = carCount;
    this.sectionHeight = () => (window.innerHeight * SECTION_HEIGHT_VH) / 100;
  }

  read(scrollY) {
    const sh = this.sectionHeight();
    const totalRotatingSections = this.carCount; // last "section" is the outro, handled outside
    const rawIndex = Math.floor(scrollY / sh);
    const index = Math.min(Math.max(rawIndex, 0), totalRotatingSections - 1);
    const local = Math.min(Math.max((scrollY - index * sh) / sh, 0), 1);

    let rotationProgress, transitionProgress, phase;
    if (local < ROTATION_END) {
      rotationProgress = local / ROTATION_END;
      transitionProgress = 0;
      phase = 'rotating';
    } else {
      rotationProgress = 1;
      transitionProgress = (local - ROTATION_END) / (1 - ROTATION_END);
      phase = 'transitioning';
    }

    const isLast = index === totalRotatingSections - 1;
    const hasNext = !isLast;

    return {
      activeIndex: index,
      nextIndex: hasNext ? index + 1 : null,
      rotationProgress,
      transitionProgress: isLast ? 0 : transitionProgress,
      // for the last car, use the tail of its section to fade toward the outro instead of a car swap
      outroProgress: isLast ? transitionProgress : 0,
      phase,
      isLast
    };
  }
}
