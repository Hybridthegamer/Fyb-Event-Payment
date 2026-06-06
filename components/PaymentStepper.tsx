interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Your Details' },
  { number: 2, label: 'Options' },
  { number: 3, label: 'Payment' },
  { number: 4, label: 'Your Ticket' },
];

interface PaymentStepperProps {
  currentStep: number;
}

export default function PaymentStepper({ currentStep }: PaymentStepperProps) {
  return (
    <div className="flex items-center justify-center w-full overflow-x-auto py-2">
      <div className="flex items-center gap-0 min-w-max">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-inter font-semibold transition-all ${
                    isCompleted
                      ? 'bg-[#C9A227] text-[#1A0505]'
                      : isActive
                      ? 'bg-gradient-to-br from-[#C9A227] to-[#E8C84A] text-[#1A0505] ring-4 ring-[rgba(201,162,39,0.3)]'
                      : 'bg-[#4A1515] text-[#C4A882] border border-[rgba(201,162,39,0.3)]'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-[10px] font-inter mt-1 whitespace-nowrap ${
                    isActive ? 'text-[#C9A227] font-medium' : 'text-[#C4A882]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 sm:w-16 h-px mx-1 mb-4 ${
                    currentStep > step.number
                      ? 'bg-[#C9A227]'
                      : 'bg-[rgba(201,162,39,0.2)]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
