export interface OnboardingStepProps {
    data: Record<string, any>;
    onNext: (stepData?: Record<string, any>) => void;
    onPrevious: (stepData?: Record<string, any>) => void;
    onUpdate?: (stepData?: Record<string, any>) => void;
    isFirst?: boolean;
    isLast?: boolean;
}
