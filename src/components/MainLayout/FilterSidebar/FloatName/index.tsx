import React, { FC, useRef, useState } from 'react';
import styles from './floatName.module.scss';

const FloatName: FC<any> = props => {
  const { children } = props;
  const [text, setText] = useState(null);

  const [, setCoordinates] = useState({ x: 0, y: 0 });

  const timerRef: any = useRef(null);

  const overMouseMove = (e: any) => {
    e.preventDefault();
    const target = e.target;
    clearTimeout(timerRef.current);

    if (target.id === 'filterText' && target.innerText.length > 22) {
      const currentPositionFrame = target.getBoundingClientRect();
      timerRef.current && clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setText(target.innerText);
        setCoordinates({ x: currentPositionFrame.x, y: currentPositionFrame.y });

        target.addEventListener('mouseleave', onMouseLeave);
        document.getElementById('filterItems')?.addEventListener('scroll', onScroll);
      }, 800);

      const onMouseLeave = () => {
        setText(null);
        clearTimeout(timerRef.current);
        target.removeEventListener('mouseleave', onMouseLeave);
      };

      const onScroll = () => {
        setText(null);
        clearTimeout(timerRef.current);
        document.getElementById('filterItems')?.removeEventListener('scroll', onScroll);
      };
    }
  };

  return (
    <div
      // className={styles.floatName}

      onMouseMove={overMouseMove}
      onMouseLeave={() => {
        setText(null);
      }}
    >
      {text && (
        <div
          // style={{ top: coordinates.y - 23 + 'px', left: coordinates.x - 5 + 'px' }}
          className={styles.floatName__popup}
        >
          {text}
        </div>
      )}
      {children}
    </div>
  );
};

export default FloatName;
