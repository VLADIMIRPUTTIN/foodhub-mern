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
    <div style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); overflow: hidden;">
      {profileImageSection}
    </div>
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Verify Your Email</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Welcome to FoodHub, {userName}! 🍳</p>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(207, 153, 108, 0.15);">
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello {userName}! 👋</p>
    <p style="color: #666; margin-bottom: 25px;">Thank you for joining FoodHub! Please verify your email with the code below:</p>
    
    <!-- Verification Code -->
    <div style="text-align: center; margin: 30px 0; padding: 25px; background: rgba(207, 153, 108, 0.08); border-radius: 15px; border: 2px dashed rgba(207, 153, 108, 0.3);">
      <p style="font-size: 12px; color: #CF996C; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Verification Code</p>
      <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 10px rgba(207, 153, 108, 0.15);">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #CF996C; font-family: 'Courier New', monospace;">{verificationCode}</span>
      </div>
    </div>
    
    <!-- Quick Info -->
    <div style="background: rgba(255, 193, 7, 0.1); padding: 15px; border-radius: 10px; margin: 20px 0; display: flex; align-items: center; gap: 10px;">
      <i class="bx bx-time" style="font-size: 18px; color: #ffc107;"></i>
      <p style="margin: 0; font-size: 14px; color: #856404;">⏰ Expires in 15 minutes</p>
    </div>
    
    <p style="font-size: 13px; color: #888; text-align: center; margin-top: 25px;">If you didn't create an account, you can ignore this email.</p>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #CF996C; font-weight: 600; margin: 0;">The FoodHub Team</p>
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
    <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
      <i class="bx bx-shield-check" style="font-size: 28px; color: white;"></i>
    </div>
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Password Reset Successful</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your account is secure! 🔒</p>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(76, 175, 80, 0.15);">
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <i class="bx bx-check" style="font-size: 40px; color: white;"></i>
      </div>
    </div>
    
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello! 👋</p>
    <p style="color: #666; margin-bottom: 25px;">Great news! Your FoodHub password has been successfully reset.</p>
    
    <!-- Success Message -->
    <div style="background: rgba(76, 175, 80, 0.1); padding: 20px; border-radius: 15px; text-align: center; margin: 25px 0;">
      <h3 style="color: #4CAF50; font-size: 18px; margin: 0 0 10px 0;">✅ All Set!</h3>
      <p style="margin: 0; color: #333; font-size: 15px;">You can now continue exploring delicious recipes!</p>
    </div>
    
    <!-- Security Warning -->
    <div style="background: rgba(255, 107, 107, 0.1); padding: 15px; border-radius: 10px; margin: 20px 0; display: flex; align-items: center; gap: 10px;">
      <i class="bx bx-error" style="font-size: 18px; color: #ff6b6b;"></i>
      <div>
        <p style="margin: 0; font-size: 14px; color: #721c24; font-weight: 600;">Didn't request this?</p>
        <p style="margin: 0; font-size: 12px; color: #721c24;">Contact support immediately.</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #4CAF50; font-weight: 600; margin: 0;">The FoodHub Team</p>
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
    <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
      <i class="bx bx-key" style="font-size: 28px; color: white;"></i>
    </div>
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Reset Password</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Let's get you back to cooking! 🍳</p>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(255, 152, 0, 0.15);">
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello! 👋</p>
    <p style="color: #666; margin-bottom: 25px;">We received a request to reset your FoodHub password. Click the button below to continue:</p>
    
    <!-- Reset Button -->
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: rgba(255, 152, 0, 0.1); padding: 25px; border-radius: 15px; border: 2px dashed rgba(255, 152, 0, 0.3);">
        <a href="{resetURL}" style="display: inline-block; background: linear-gradient(135deg, #CF996C, #BB8860); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px;">
          <i class="bx bx-reset" style="margin-right: 8px;"></i>
          Reset My Password
        </a>
      </div>
    </div>
    
    <!-- Quick Info -->
    <div style="background: rgba(255, 193, 7, 0.1); padding: 15px; border-radius: 10px; margin: 20px 0; display: flex; align-items: center; gap: 10px;">
      <i class="bx bx-time" style="font-size: 18px; color: #ffc107;"></i>
      <p style="margin: 0; font-size: 14px; color: #856404;">⏰ Link expires in 1 hour</p>
    </div>
    
    <p style="font-size: 13px; color: #888; text-align: center; margin-top: 25px;">If you didn't request this, you can safely ignore this email.</p>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #CF996C; font-weight: 600; margin: 0;">The FoodHub Team</p>
    </div>
  </div>
</body>
</html>
`;
