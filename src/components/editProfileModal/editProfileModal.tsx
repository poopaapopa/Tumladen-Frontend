import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './editProfileModal.module.scss';
import { FormField } from '@/components/formField/formField';
import { validateField } from '@/utils/validation';
import { userService } from '@/api/user';
import { useUserStore } from '@/store/useUserStore';
import { MINIO_URL } from '@/api/config';
import type { OwnUserProfile } from '@/types/user';
import type { Actor } from '@/api/auth';
import elfAvatar from '@/assets/elf-avatar.svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileFields = 'nickname' | 'email' | 'password' | 'passwordConfirm';

interface FormData {
  nickname: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

interface EditProfileModalProps {
  profile: OwnUserProfile;
  closeAttemptTrigger: number;
  onConfirmClose: () => void;
  onSuccess: (updated: OwnUserProfile) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${MINIO_URL}${url}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditProfileModal({
  profile,
  closeAttemptTrigger,
  onConfirmClose,
  onSuccess,
}: EditProfileModalProps) {
  const { token, updateActor } = useUserStore();

  // ── Form state ──────────────────────────────────────────────────────────────
  const initialForm: FormData = {
    nickname: profile.nickname,
    email: profile.email,
    password: '',
    passwordConfirm: '',
  };

  const [formData, setFormData] = useState<FormData>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProfileFields, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<ProfileFields, boolean>>>({});

  // ── Avatar state ────────────────────────────────────────────────────────────
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarSrc(profile.avatarUrl));
  const [pendingDelete, setPendingDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  // ── Dirty detection ─────────────────────────────────────────────────────────
  const isFormDirty = useCallback(() => {
    const avatarChanged = pendingFile !== null || (pendingDelete && !!profile.avatarUrl);

    return (
      formData.nickname !== initialForm.nickname ||
      formData.email !== initialForm.email ||
      formData.password.length > 0 ||
      avatarChanged
    );
  }, [formData, pendingFile, pendingDelete, profile.avatarUrl]);

  // ── Close-attempt logic (same two-click pattern as authModal) ───────────────
  useEffect(() => {
    if (closeAttemptTrigger === 0) return;

    if (!isFormDirty()) {
      onConfirmClose();
      return;
    }

    if (isConfirmingClose) {
      onConfirmClose();
    } else {
      setIsConfirmingClose(true);
      setShowUnsaved(true);
    }
  }, [closeAttemptTrigger]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const runValidation = (name: ProfileFields, value: string) => {
    const error = validateField(name, value, { mode: 'profile', password: formData.password });
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[name] = error;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as ProfileFields;
    const value = e.target.value;

    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };
      if (name === 'password') {
        const confirmError = validateField('passwordConfirm', nextData.passwordConfirm, {
          mode: 'profile',
          password: value
        });
        setFieldErrors(errs => {
          const nextErrs = {...errs};
          if (confirmError && nextData.passwordConfirm.length > 0) nextErrs.passwordConfirm = confirmError;
          else delete nextErrs.passwordConfirm;
          return nextErrs;
        })
      }
      return nextData
    });
    
    setGlobalError(null);

    if (isConfirmingClose) {
      setIsConfirmingClose(false);
      setShowUnsaved(false);
    }

    // When password becomes empty, the confirm-password field disappears.
    // Reset its touched/error state so it reappears clean next time.
    if (name === 'password' && value.length === 0) {
      setTouched((prev) => {
        const next = { ...prev };
        delete next.passwordConfirm;
        return next;
      });
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        delete next.passwordConfirm;
        return next;
      });
      return;
    }

    // While typing, do not create new errors — errors should appear only on blur.
    // If this field already has an error, clear it as soon as the value becomes valid.
    if (fieldErrors[name]) {
      const error = validateField(
        name,
        value,
        { mode: 'profile', password: name === 'password' ? value : formData.password },
      );
      if (!error) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as ProfileFields;
    setTouched((prev) => ({ ...prev, [name]: true }));
    runValidation(name, formData[name]);
  };

  // ── Avatar handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingDelete(false);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDeleteAvatar = () => {
    setPendingFile(null);
    setPreviewUrl(null);

    // If the user uploaded a new photo and then removed it while there was no
    // original avatar, this returns the avatar state to the initial one — no change.
    setPendingDelete(!!profile.avatarUrl);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!token) return;

    // Touch all fields to surface any remaining errors
    const allFields: ProfileFields[] = ['nickname', 'email', 'password', 'passwordConfirm'];
    const newTouched = Object.fromEntries(allFields.map((f) => [f, true])) as Record<ProfileFields, boolean>;
    setTouched(newTouched);

    // Re-run validation for all fields
    const errors: Partial<Record<ProfileFields, string>> = {};
    for (const name of allFields) {
      const err = validateField(name, formData[name], { mode: 'profile', password: formData.password });
      if (err) errors[name] = err;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setGlobalError('Пожалуйста, исправьте ошибки в полях');
      return;
    }

    setLoading(true);
    setGlobalError(null);

    try {
      let avatarUrl = profile.avatarUrl;
      let updatedProfile: OwnUserProfile | null = null;

      // 1. Avatar: delete or upload.
      // Avatar endpoints return only { avatarUrl }, not the full profile.
      if (pendingDelete && profile.avatarUrl) {
        const avatarResponse = await userService.deleteAvatar(token);
        avatarUrl = avatarResponse.avatarUrl;
      } else if (pendingFile) {
        const avatarResponse = await userService.uploadAvatar(token, pendingFile);
        avatarUrl = avatarResponse.avatarUrl;
      }

      // 2. Profile text fields.
      // Backend expects nickname and email every time; password fields are optional.
      const shouldUpdateProfile =
        formData.nickname !== profile.nickname ||
        formData.email !== profile.email ||
        formData.password.length > 0;

      if (shouldUpdateProfile) {
        const profilePayload: Parameters<typeof userService.updateProfile>[1] = {
          nickname: formData.nickname,
          email: formData.email,
        };

        if (formData.password.length > 0) {
          profilePayload.password = formData.password;
          profilePayload.passwordConfirm = formData.passwordConfirm;
        }

        updatedProfile = await userService.updateProfile(token, profilePayload);
      }

      const updated: OwnUserProfile = {
        ...profile,
        ...(updatedProfile ?? {}),
        avatarUrl,
      };

      // Update the global store so header/other components reflect the change.
      const newActor: Actor = {
        id: updated.id,
        displayName: updated.nickname,
        type: 'user',
        avatarUrl: updated.avatarUrl,
      };
      updateActor(newActor);

      onSuccess(updated);
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (msg.includes('email')) {
        setFieldErrors((p) => ({ ...p, email: 'Этот Email уже занят' }));
      } else if (msg.includes('nickname')) {
        setFieldErrors((p) => ({ ...p, nickname: 'Этот никнейм уже занят' }));
      } else {
        setGlobalError('Не удалось сохранить изменения. Попробуйте ещё раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const hasAvatar = previewUrl !== null;
  const hasChanges = isFormDirty();
  const hasVisibleErrors = Object.keys(fieldErrors).length > 0;

  // Instant validation for the save button only.
  // It does not write to fieldErrors, so visual errors still appear only on blur.
  const hasInstantValidationErrors = (['nickname', 'email', 'password', 'passwordConfirm'] as ProfileFields[])
    .some((name) => !!validateField(name, formData[name], { mode: 'profile', password: formData.password }));

  return (
    <div className={styles.editProfileModal}>
      <h2 className={styles.editProfileModal__title}>Редактирование профиля</h2>

      <div className={styles.editProfileModal__layout}>
        {/* ── Left: avatar ──────────────────────────────────────────────────── */}
        <div className={styles.editProfileModal__avatarCol}>
          <div className={styles.editProfileModal__avatarCard}>
            <div className={styles.editProfileModal__avatarWrapper}>
              {hasAvatar ? (
                <img
                  src={previewUrl!}
                  alt="Аватар"
                  className={styles.editProfileModal__avatarImg}
                />
              ) : (
                <div
                  className={styles.editProfileModal__avatarPlaceholder}
                  style={{ '--avatar-url': `url(${elfAvatar})` } as CSSProperties}
                />
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div className={styles.editProfileModal__avatarBtns}>
            <button
              type="button"
              className={`${styles.editProfileModal__avatarBtn} ${styles.editProfileModal__avatarBtn_upload}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {hasAvatar ? 'Изменить фото' : 'Загрузить фото'}
            </button>

            {hasAvatar && (
              <button
                type="button"
                className={`${styles.editProfileModal__avatarBtn} ${styles.editProfileModal__avatarBtn_delete}`}
                onClick={handleDeleteAvatar}
              >
                Удалить фото
              </button>
            )}
          </div>
        </div>

        {/* ── Right: form ───────────────────────────────────────────────────── */}
        <div className={styles.editProfileModal__formCol}>
          <FormField
            name="nickname"
            label="Никнейм"
            value={formData.nickname}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.nickname ? fieldErrors.nickname : undefined}
            bgColor="#F5F5DC"
          />
          <FormField
            name="email"
            label="Электронная почта"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? fieldErrors.email : undefined}
            bgColor="#F5F5DC"
          />
          <FormField
            name="password"
            label="Новый пароль (необязательно)"
            type="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? fieldErrors.password : undefined}
            autoComplete="new-password"
            bgColor="#F5F5DC"
          />
          {formData.password.length > 0 && (
            <FormField
              name="passwordConfirm"
              label="Повторите новый пароль"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.passwordConfirm ? fieldErrors.passwordConfirm : undefined}
              autoComplete="new-password"
              bgColor="#F5F5DC"
            />
          )}
        </div>
      </div>

      {/* ── Bottom: banners + save button ─────────────────────────────────── */}
      <div className={styles.editProfileModal__bottom}>
        <AnimatePresence>
          {showUnsaved && (
            <motion.div
              key="unsaved"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className={styles.editProfileModal__unsavedBanner}
            >
              Изменения не сохранятся, если закрыть без сохранения. Нажмите ещё раз для закрытия.
            </motion.div>
          )}
          {globalError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className={styles.editProfileModal__errorBanner}
            >
              {globalError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.editProfileModal__footer}>
          <button
            type="button"
            className={styles.editProfileModal__saveBtn}
            onClick={handleSubmit}
            disabled={loading || !hasChanges || hasVisibleErrors || hasInstantValidationErrors}
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  );
}
