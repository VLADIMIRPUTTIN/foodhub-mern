export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - FoodHub</title>
  <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
</head>
<body style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fef9f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #CF996C, #BB8860); padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
    <div style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); overflow: hidden; border: 3px solid rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      {profileImageSection}
    </div>
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Verify Your Email</h1>
    <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px;">Welcome to FoodHub, {userName}! 🍳</p>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 35px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(207, 153, 108, 0.15);">
    <div style="text-align: center; margin-bottom: 25px;">
      <p style="font-size: 18px; color: #333; margin-bottom: 8px; font-weight: 600;">Hello {userName}! 👋</p>
      <p style="color: #666; margin-bottom: 25px; font-size: 15px; line-height: 1.6;">Thank you for joining FoodHub! We're excited to have you in our culinary community. Please verify your email with the code below:</p>
    </div>
    
    <!-- Verification Code -->
    <div style="text-align: center; margin: 35px 0; padding: 30px; background: rgba(207, 153, 108, 0.08); border-radius: 20px; border: 2px dashed rgba(207, 153, 108, 0.3);">
      <p style="font-size: 12px; color: #CF996C; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">Your Verification Code</p>
      <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(207, 153, 108, 0.2); margin-bottom: 15px;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #CF996C; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(207, 153, 108, 0.3);">{verificationCode}</span>
      </div>
      <p style="font-size: 12px; color: #999; margin: 0;">Enter this code in the verification form</p>
    </div>
    
    <!-- Features Preview -->
    <div style="background: linear-gradient(135deg, rgba(207, 153, 108, 0.1), rgba(187, 136, 96, 0.1)); padding: 25px; border-radius: 15px; margin: 25px 0;">
      <h3 style="color: #CF996C; font-size: 16px; margin: 0 0 15px 0; text-align: center;">🎉 What awaits you at FoodHub:</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
        <div style="flex: 1; min-width: 120px; text-align: center;">
          <i class="bx bx-restaurant" style="font-size: 24px; color: #CF996C; margin-bottom: 5px;"></i>
          <p style="margin: 0; font-size: 13px; color: #666;">Discover Recipes</p>
        </div>
        <div style="flex: 1; min-width: 120px; text-align: center;">
          <i class="bx bx-heart" style="font-size: 24px; color: #CF996C; margin-bottom: 5px;"></i>
          <p style="margin: 0; font-size: 13px; color: #666;">Save Favorites</p>
        </div>
        <div style="flex: 1; min-width: 120px; text-align: center;">
          <i class="bx bx-share-alt" style="font-size: 24px; color: #CF996C; margin-bottom: 5px;"></i>
          <p style="margin: 0; font-size: 13px; color: #666;">Share Creations</p>
        </div>
      </div>
    </div>
    
    <!-- Quick Info -->
    <div style="background: rgba(255, 193, 7, 0.1); padding: 18px; border-radius: 12px; margin: 25px 0; display: flex; align-items: center; gap: 12px; border-left: 4px solid #ffc107;">
      <i class="bx bx-time-five" style="font-size: 20px; color: #ffc107;"></i>
      <div>
        <p style="margin: 0; font-size: 14px; color: #856404; font-weight: 600;">⏰ Code expires in 15 minutes</p>
        <p style="margin: 0; font-size: 12px; color: #856404;">Make sure to verify your account soon!</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(108, 117, 125, 0.1); border-radius: 10px;">
      <p style="font-size: 13px; color: #6c757d; margin: 0; line-height: 1.5;">
        <i class="bx bx-info-circle" style="margin-right: 5px;"></i>
        If you didn't create an account with FoodHub, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 2px solid #f8f9fa;">
      <div style="margin-bottom: 10px;">
        <span style="color: #CF996C; font-size: 24px;">🍳</span>
      </div>
      <p style="color: #CF996C; font-weight: 700; margin: 0; font-size: 16px;">The FoodHub Team</p>
      <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Happy Cooking!</p>
    </div>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Success - FoodHub</title>
  <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
</head>
<body style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fef9f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
    <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      {profileImageSection}
    </div>
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Password Reset Successful</h1>
    <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px;">Your account is secure! 🔒</p>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 35px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(76, 175, 80, 0.15);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);">
        <i class="bx bx-check" style="font-size: 50px; color: white;"></i>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 25px;">
      <p style="font-size: 18px; color: #333; margin-bottom: 8px; font-weight: 600;">Hello {userName}! 👋</p>
      <p style="color: #666; margin-bottom: 25px; font-size: 15px; line-height: 1.6;">Great news! Your FoodHub password has been successfully reset.</p>
    </div>
    
    <!-- Success Message -->
    <div style="background: rgba(76, 175, 80, 0.1); padding: 25px; border-radius: 15px; text-align: center; margin: 30px 0; border-left: 4px solid #4CAF50;">
      <h3 style="color: #4CAF50; font-size: 20px; margin: 0 0 10px 0;">✅ All Set!</h3>
      <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">You can now continue exploring delicious recipes and sharing your culinary adventures!</p>
    </div>
    
    <!-- Security Warning -->
    <div style="background: rgba(255, 107, 107, 0.1); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ff6b6b;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <i class="bx bx-error-circle" style="font-size: 24px; color: #ff6b6b; margin-top: 2px;"></i>
        <div>
          <p style="margin: 0 0 5px 0; font-size: 15px; color: #721c24; font-weight: 600;">Didn't request this password reset?</p>
          <p style="margin: 0; font-size: 13px; color: #721c24; line-height: 1.4;">If you didn't make this request, your account may be compromised. Please contact our support team immediately.</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 2px solid #f8f9fa;">
      <div style="margin-bottom: 10px;">
        <span style="color: #4CAF50; font-size: 24px;">🔒</span>
      </div>
      <p style="color: #4CAF50; font-weight: 700; margin: 0; font-size: 16px;">The FoodHub Team</p>
      <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Stay Safe & Happy Cooking!</p>
    </div>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - FoodHub</title>
  <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
</head>
<body style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fef9f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FF9800, #F57C00); padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
    <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden;">
      {profileImageSection}
    </div>
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Reset Password</h1>
    <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px;">Let's get you back to cooking! 🍳</p>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 35px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(255, 152, 0, 0.15);">
    <div style="text-align: center; margin-bottom: 25px;">
      <p style="font-size: 18px; color: #333; margin-bottom: 8px; font-weight: 600;">Hello {userName}! 👋</p>
      <p style="color: #666; margin-bottom: 25px; font-size: 15px; line-height: 1.6;">We received a request to reset your FoodHub password. No worries, it happens to the best of us! Click the button below to create a new password:</p>
    </div>
    
    <!-- Reset Button -->
    <div style="text-align: center; margin: 35px 0;">
      <div style="background: rgba(255, 152, 0, 0.1); padding: 30px; border-radius: 20px; border: 2px dashed rgba(255, 152, 0, 0.3);">
        <p style="font-size: 12px; color: #FF9800; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">Secure Password Reset</p>
        <a href="{resetURL}" style="display: inline-block; background: linear-gradient(135deg, #CF996C, #BB8860); color: white; padding: 18px 35px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(207, 153, 108, 0.3); transition: all 0.3s ease;">
          <i class="bx bx-key" style="margin-right: 10px; font-size: 18px;"></i>
          Reset My Password
        </a>
        <p style="font-size: 12px; color: #999; margin: 15px 0 0 0;">Click the button above to proceed securely</p>
      </div>
    </div>
    
    <!-- Alternative Method -->
    <div style="background: rgba(108, 117, 125, 0.1); padding: 20px; border-radius: 12px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #6c757d; font-weight: 600;">Button not working?</p>
      <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.4;">Copy and paste this link into your browser:</p>
      <div style="background: white; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #dee2e6;">
        <p style="margin: 0; font-size: 11px; color: #6c757d; word-break: break-all; font-family: monospace;">{resetURL}</p>
      </div>
    </div>
    
    <!-- Quick Info -->
    <div style="background: rgba(255, 193, 7, 0.1); padding: 18px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ffc107;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <i class="bx bx-time-five" style="font-size: 20px; color: #ffc107; margin-top: 2px;"></i>
        <div>
          <p style="margin: 0 0 5px 0; font-size: 14px; color: #856404; font-weight: 600;">⏰ Link expires in 1 hour</p>
          <p style="margin: 0; font-size: 12px; color: #856404;">For security reasons, this reset link will expire soon.</p>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(108, 117, 125, 0.1); border-radius: 10px;">
      <p style="font-size: 13px; color: #6c757d; margin: 0; line-height: 1.5;">
        <i class="bx bx-info-circle" style="margin-right: 5px;"></i>
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 2px solid #f8f9fa;">
      <div style="margin-bottom: 10px;">
        <span style="color: #FF9800; font-size: 24px;">🔑</span>
      </div>
      <p style="color: #FF9800; font-weight: 700; margin: 0; font-size: 16px;">The FoodHub Team</p>
      <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">We're here to help!</p>
    </div>
  </div>
</body>
</html>
`;
