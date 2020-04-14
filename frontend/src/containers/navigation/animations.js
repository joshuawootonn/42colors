import anime from 'animejs';

export const buttonAnimationTag = `navigation-button`;
export const inputAnimationTag = `navigation-input`;

export const buttonTarget = `[data-animate=navigation-button]`;
export const inputTarget = `[data-animate=navigation-input]`;

export const animateNavigationIn = () => {
    const timeline = anime.timeline({
        duration: 400,
    });

    timeline
        .add({
            targets: inputTarget,
            duration: 100,
            margin: ['0px 0px', '0px 30px'],
        })
        .add({
            targets: buttonTarget,
            duration: 200,
            delay: 200,
            scale: [0, 1],
            opacity: [0, 1],
        });
};

export const animateNavigationOut = () => {
    const timeline = anime.timeline({
        duration: 400,
    });

    timeline
        .add({
            targets: buttonTarget,
            duration: 200,
            scale: [1, 0],
            opacity: [1, 0],
        })
        .add({
            targets: inputTarget,
            duration: 100,
            delay: 200,
            margin: ['0px 30px', '0px 0px'],
        });
};
