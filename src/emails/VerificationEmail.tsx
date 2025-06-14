import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  verificationCode: string;
  userEmail: string;
}

export const VerificationEmail = ({
  verificationCode = '123456',
  userEmail = 'student@ln.hk',
}: VerificationEmailProps) => (
  <Html>
    <Head>
      <style>{`
        /* 深色主題支援 */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #000000 !important;
          }
          
          .container {
            background-color: #0f0f0f !important;
          }
          
          .title {
            color: #ffffff !important;
          }
          
          .text {
            color: #ffffff !important;
          }
          
          .logo {
            color: #ef4444 !important;
          }
          
          .code-container {
            background: #18171b !important;
            border: none !important;
          }
          
          .code {
            color: #ffffff !important;
          }
          
          .footer {
            color: #e5e7eb !important;
          }
        }
        
        /* Outlook 深色主題支援 */
        [data-ogsc] body {
          background-color: #000000 !important;
        }
        
        [data-ogsc] .container {
          background-color: #0f0f0f !important;
        }
        
        [data-ogsc] .title,
        [data-ogsc] .text {
          color: #ffffff !important;
        }
        
        [data-ogsc] .logo {
          color: #ef4444 !important;
        }
        
        [data-ogsc] .code {
          color: #ffffff !important;
        }
        
        [data-ogsc] .footer {
          color: #e5e7eb !important;
        }
        
        [data-ogsc] .code-container {
          background: #18171b !important;
          border: none !important;
        }
      `}</style>
    </Head>
    <Preview>您的 LingUBible 嶺南人驗證碼</Preview>
    <Body style={main} className="body">
      <Container style={container} className="container">
        <Section style={logoContainer}>
          <Img
            src="https://lingubible.com/email-banner.png"
            width="400"
            height="120"
            alt="LingUBible"
            style={logoImage}
          />
          <Text style={logo} className="logo">LingUBible</Text>
        </Section>
        
        <Heading style={h1} className="title">嶺南人帳戶驗證</Heading>
        
        <Text style={text} className="text">
          親愛的嶺南人！感謝您註冊 LingUBible 嶺南人帳戶。請使用以下驗證碼來完成您的帳戶註冊：
        </Text>
        
        <Section style={codeContainer} className="code-container">
          <Text style={code} className="code">{verificationCode}</Text>
        </Section>
        
        <Text style={text} className="text">
          此驗證碼將在 <strong>10 分鐘</strong> 後過期。如果您沒有請求此驗證碼，請忽略此郵件。
        </Text>
        
        <Text style={text} className="text">
          <strong>注意：</strong>只有使用 @ln.hk 或 @ln.edu.hk 郵件地址的嶺南人才能註冊 LingUBible。
        </Text>
        
        <Text style={text} className="text">
          如果您有任何問題，請聯繫我們的支援團隊。
        </Text>
        
        <Text style={footer} className="footer">
          此郵件發送給 {userEmail}
          <br />
          LingUBible - 課程與講師評價平台
          <br />
          僅限 Lingnan University 嶺南人使用
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#f5f5f5',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const logoImage = {
  margin: '0 auto 16px',
  display: 'block',
};

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '0',
};

const h1 = {
  color: '#333',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
  margin: '16px 0',
  padding: '0 40px',
};

const codeContainer = {
  background: '#f4f4f4',
  borderRadius: '8px',
  margin: '32px auto',
  padding: '24px',
  textAlign: 'center' as const,
  width: 'fit-content',
  border: '2px solid #dc2626',
};

const code = {
  color: '#dc2626',
  fontFamily: 'Monaco, "Lucida Console", monospace',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '6px',
  margin: '0',
  textAlign: 'center' as const,
};

const footer = {
  color: '#8898aa',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '0 40px',
};

export default VerificationEmail; 