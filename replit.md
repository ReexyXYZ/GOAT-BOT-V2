# Overview

This is **GoatBot v3.0.0**, a Facebook Messenger chatbot built on the GoatBot V2 framework with enhanced stability and always-on capabilities. The bot serves as a sophisticated multi-purpose automation platform for Facebook group management and user interaction. It features a comprehensive command system with 235+ commands, real-time communication capabilities, AI integration, and a web-based dashboard for configuration management. The bot operates through Facebook's unofficial chat API and includes advanced features like plugin systems, voice processing, MongoDB integration for data persistence, and automatic configuration synchronization on startup.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Framework Architecture
The system is built on a modular Node.js architecture with clear separation of concerns:

- **Entry Point**: `index.js` spawns the main `Goat.js` process with automatic restart capabilities
- **Main Process**: `Goat.js` handles initialization, configuration validation, and core setup
- **Event-Driven Architecture**: Uses Facebook's unofficial chat API for real-time message processing
- **Modular Command System**: Dynamically loads commands from `/scripts/cmds/` directory
- **Event Handling**: Separate event handlers in `/scripts/events/` for different Facebook events
- **Auto-Sync System**: Automatically synchronizes configurations on startup for consistent state

## Authentication & Login System
Multiple authentication methods are supported:
- **Cookie-based Login**: Primary method using stored Facebook cookies in `account.txt`
- **Email/Password Login**: Fallback method with 2FA support
- **Mobile Basic Login**: Alternative method via `loginMbasic.js`
- **Token-based Login**: Support for Facebook access tokens

The login system includes automatic cookie refresh, checkpoint handling, and proxy support for reliability.

## Database Architecture
Flexible multi-database support with unified API:
- **MongoDB**: Primary database for production deployments
- **SQLite**: Lightweight option for development/testing
- **JSON**: File-based storage for simple deployments

Data models include:
- **User Data**: Individual user settings, stats, and preferences
- **Thread Data**: Group chat configurations and settings
- **Dashboard Data**: Web interface user accounts
- **Global Data**: Bot-wide configurations and shared data

## Web Dashboard System
Full-featured web interface built with Express.js:
- **Authentication**: Secure login with reCAPTCHA protection
- **Thread Management**: Per-group configuration interfaces
- **File Management**: Google Drive integration for media handling
- **Real-time Updates**: WebSocket support for live configuration changes
- **Responsive Design**: Bootstrap-based UI with mobile support

## Command Processing Pipeline
Sophisticated command handling with multiple layers:
- **Prefix Detection**: Configurable command prefixes (`-` for users, `!` for admins)
- **Permission System**: 5-tier role system (0=user, 1=group admin, 2=bot admin, 3=premium, 4=owner)
- **Rate Limiting**: Per-user and per-command cooldowns
- **Input Validation**: Automatic parameter parsing and validation
- **Error Handling**: Graceful error recovery with user feedback
- **Configuration Sync**: Automatic synchronization of prefix and premium settings on startup

## Plugin System Architecture
Dynamic plugin loading with hot-reload capabilities:
- **Plugin Discovery**: Automatic detection of new plugins
- **Dependency Management**: NPM package installation for plugin requirements
- **Version Control**: Plugin versioning and update management
- **Marketplace Integration**: Community plugin repository access
- **Sandboxed Execution**: Isolated plugin execution environment

## File Storage & Media Handling
Integrated Google Drive API for scalable media storage:
- **Automatic Upload**: Direct media upload to Google Drive
- **Access Control**: Per-thread file access permissions
- **MIME Type Detection**: Automatic file type classification
- **Streaming Support**: Efficient large file handling
- **CDN Integration**: Fast content delivery for media files

## Real-time Communication
WebSocket-based real-time features:
- **Live Notifications**: Instant push notifications to dashboard users
- **Typing Indicators**: Real-time typing status updates
- **Event Streaming**: Live bot activity monitoring
- **Bidirectional Communication**: Dashboard-to-bot command execution

## Security & Configuration
Comprehensive security measures:
- **Environment Separation**: Development/production configuration isolation
- **API Key Management**: Secure credential storage and rotation
- **Input Sanitization**: XSS and injection prevention
- **Rate Limiting**: DDoS protection and abuse prevention
- **Whitelist Systems**: User and thread access control

# External Dependencies

## Core Infrastructure
- **Node.js 20.x**: JavaScript runtime environment
- **Express.js 4.18.1**: Web server framework for dashboard
- **Socket.IO**: Real-time bidirectional communication
- **Mongoose 6.3.1**: MongoDB object modeling
- **Sequelize**: SQL database ORM for SQLite support

## Facebook Integration
- **Custom FB Chat API**: Modified unofficial Facebook API client
- **MQTT Client**: Facebook's messaging protocol implementation
- **Axios**: HTTP client for Facebook Graph API requests
- **Cheerio**: HTML parsing for Facebook page scraping

## Authentication & Security
- **BCrypt 5.0.1**: Password hashing and authentication
- **Passport.js**: Authentication middleware
- **Google reCAPTCHA v2**: Bot protection for web forms
- **Express Rate Limit**: API rate limiting and abuse prevention

## Media & File Processing
- **Google APIs 100.0.0**: Google Drive API integration
- **Canvas 3.2.0**: Image manipulation and generation
- **JIMP 0.22.12**: JavaScript image processing
- **MIME-DB**: File type detection and validation

## Development & Utilities
- **Nodemon**: Development server auto-restart
- **Moment.js**: Date/time manipulation with timezone support
- **Lodash**: Utility functions for data manipulation
- **Gradient String**: Colorful console logging
- **Ora**: Loading spinners for CLI operations

## Communication Services
- **Nodemailer 6.7.5**: Email service integration
- **Google Gmail API**: Email sending via Gmail SMTP
- **Telegram Bot API**: Optional Telegram notifications
- **Custom API Endpoints**: External service integrations

## AI & Advanced Features
- **Multiple AI Models**: GPT-4, Claude, Gemini integration support
- **Speech Processing**: Text-to-speech and speech-to-text capabilities
- **Language Support**: Multi-language internationalization
- **Analytics System**: Usage tracking and performance monitoring