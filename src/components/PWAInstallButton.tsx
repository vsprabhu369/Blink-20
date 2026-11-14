import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DarkThemeVariant } from '../themes';

interface PWAInstallButtonProps {
  theme: DarkThemeVariant;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ theme }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${theme.workButtonClass}`}
      >
        <Download className="w-3.5 h-3.5" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`min-h-[40px] px-3 py-2 rounded-xl border ${theme.borderClass} ${theme.textSecondaryClass} ${theme.surfaceHoverClass} text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors`}
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
            <div
              className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border ${theme.surfaceClass} ${theme.borderClass} p-6 shadow-2xl`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-semibold ${theme.textPrimaryClass}`}>
                  Install Blink 20
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className={`min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl ${theme.textMutedClass}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className={`mt-2 text-sm leading-relaxed ${theme.textSecondaryClass}`}>
                1. Tap the <strong>Share</strong> icon in your browser bar.
                <br />
                2. Select <strong>Add to Home Screen</strong> for a lightweight native-style app experience.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className={`mt-5 w-full min-h-[44px] rounded-xl text-sm font-semibold ${theme.workButtonClass}`}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
