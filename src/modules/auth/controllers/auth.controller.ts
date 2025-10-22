import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { IUserSession } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import { User } from '@common/decorators/user.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { IUser } from '@modules/users/interfaces/user.interface';
import { RESOURCES } from '@common/constants';
import { GoogleOAuthGuard } from '../../../guards/google-oauth.guard';
import { IRequest } from '@common/interfaces/request.interface';
import { MailAuthService } from '../services/mail.service';

@ApiTags('Auth')
@Controller({
  path: RESOURCES.AUTH,
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailAuthService: MailAuthService,
  ) {}

  @Post('/register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account and returns access and refresh tokens',
  })
  @ApiBody({ type: RegisterDto })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user credentials and returns access and refresh tokens',
  })
  @ApiBody({ type: LoginDto })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('/refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Refresh tokens',
    description: 'Uses a valid refresh token to generate new tokens',
  })
  @ApiBody({ type: RefreshTokenDto })
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto, @User() user: IUserSession | IUser) {
    return this.authService.refreshTokens(refreshTokenDto.refresh_token, user);
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidates the current session and refresh tokens',
  })
  logout(@User() user: IUserSession) {
    return this.authService.logout(user.id, user);
  }

  @Post('/email/verify-otp')
  @ApiBody({ type: VerifyOtpDto })
  @ApiOperation({ summary: 'User verify with send email otp code' })
  verify(@Body() payload: VerifyOtpDto) {
    return this.mailAuthService.verifyOtp(payload);
  }

  @Post('/email/resend-otp')
  @ApiBody({ type: ResendDto })
  @ApiOperation({ summary: 'User resend code to gmail' })
  resend(@Body() payload: ResendDto) {
    return this.mailAuthService.resendOtp(payload);
  }

  @Post('/password/forgot')
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset OTP code to user email',
  })
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload.email);
  }

  @Post('/password/reset')
  @ApiBody({ type: ResetPasswordDto })
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password with verified OTP code',
  })
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload.code, payload.otp, payload.newPassword);
  }

  @Get('/google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth Login',
    description: 'Initiates Google OAuth authentication flow',
  })
  googleAuth() {
    return;
  }

  @Get('/google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth Callback',
    description: 'Handles Google OAuth callback and returns tokens',
  })
  googleCallback(@Req() req: IRequest) {
    return req.user;
  }
}
