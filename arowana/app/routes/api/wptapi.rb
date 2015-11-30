# Any Sample project Rest APIs locates here
module Arowana
    module RestAPI
        class WPTAPI < BaseAPI
            
            get '/rest/wptresult' do 
	            return 'service is ready for use!'
            end
            
        end
    end
end