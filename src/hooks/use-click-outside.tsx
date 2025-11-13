import { useEffect } from "react";

export const useClickOutside = (refs: Array<React.RefObject<HTMLElement | null>>, callback?: (event: MouseEvent) => void) => {
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node | null;
            const isOutside = refs.every((ref) => !ref?.current || !target || !ref.current.contains(target));

            if (isOutside && typeof callback === "function") {
                callback(event);
            }
        };

        window.addEventListener("mousedown", handleOutsideClick);

        return () => {
            window.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [callback, refs]);
};
