import { QuoteStatusPage } from './components/QuoteStatusPage';

const companyInfo = {
    name: '一帆安全整合有限公司',
    phone: '02-7730-1158',
    email: 'safekings@gmail.com',
    address: '台北市大安區四維路14巷15號7樓之1',
    logoUrl: '/images/logo.png',
};

export default function QuoteNotFound() {
    return <QuoteStatusPage type="not_found" companyInfo={companyInfo} />;
}
