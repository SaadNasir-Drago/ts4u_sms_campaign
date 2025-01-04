import CampaignList from '../components/CampaignList'
import CampaignForm from '../components/CampaignForm'
import NotificationComponent from '../components/NotificationComponent'

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold my-8">Campaign Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Create Campaign</h2>
          <CampaignForm />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Campaign List</h2>
          <CampaignList />
        </div>
      </div>
      <NotificationComponent />
    </div>
  )
}

